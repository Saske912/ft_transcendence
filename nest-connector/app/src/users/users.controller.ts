import {
	Body,
	Controller,
	Get, HttpException, HttpStatus,
	Post,
	Query,
	Req, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { EmptyDTO } from "app.dto";
import { AuthService } from "auth/auth.service";
import { isDefined } from "class-validator";
import { saveImageToStorage } from "users/image-storage";
import {
	CreateUserDTO,
	GetUsersDTO,
	LoginDTO,
	SubscribeHandlerDTO,
	UpdateAvatarDTO,
	UpdateUsernameDTO
} from "users/users.dto";
import { UsersService } from 'users/users.service';

import { OnlineUser } from './users.interface';

@Controller('users')
export class UsersController {
	constructor(
		private usersService: UsersService,
		private authService: AuthService,
	) {}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@Post('create')
	async createUser(@Body() { login, pass }: CreateUserDTO) {
		const bad = ' \\/|;<>&?:{}[]()';
		for (let i = 0; i < login.length; i++) {
			if (bad.indexOf(login[i]) !== -1) {
				return { ok: false, msg: `Bad character ('${login[i]}') in login` };
			}
		}
		const r = await this.usersService.createLocal(login, pass, null)
			.catch(e => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				throw new HttpException(e.detail, HttpStatus.BAD_REQUEST);
			});
		return { ok: true, msg: `User ${r.login} created` };
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@Get()
	async getUsers(@Query() { login, expand }: GetUsersDTO) {
		if (login) {
			const user = await this.usersService.findOneByLogin(login, isDefined(expand));
			if (!user)
				return null;
			delete user.password;
			return user;
		}
		const users = await this.usersService.findAll(isDefined(expand));
		for (const user of users) delete user.password;
		return users;
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Get('online')
	getOnline(@Query() {  }: EmptyDTO) {
		// excluding socket property
		return this.usersService.onlineUsers.map(usr => UsersService.onlineUserToJson(usr));
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Get('subscribe')
	async subscribeHandler(@Req() req: {user: OnlineUser}, @Query() { target }: SubscribeHandlerDTO) {
		const user = req.user;

		return await this.usersService.subscribeToUser(user.id, target);
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Get('unsubscribe')
	async unsubscribeHandler(@Req() req: {user: OnlineUser}, @Query() { target }: SubscribeHandlerDTO) {
		const user = req.user;

		return await this.usersService.unsubscribeFromUser(user.id, target);
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Post('updateAvatar')
	async updateAvatar(@Req() req: {user: OnlineUser}, @Body() { urlAvatar }: UpdateAvatarDTO) {
		const user = req.user;

		return await this.usersService.updateAvatar(user.id, urlAvatar);
	}

	// @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@UseInterceptors(FileInterceptor('picture', saveImageToStorage))
	@Post('uploadAvatar')
	async uploadAvatar(@Req() req: {user: OnlineUser}, @UploadedFile() file: Express.Multer.File) {
		const user = req.user;

		if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg')
			throw new HttpException('Only png/jpg/jpeg allowed', HttpStatus.BAD_REQUEST);
		const url = process.env.API_URL || 'http://localhost:3000';
		return await this.usersService.uploadAvatar(user.id, `${url}/images/${file.filename}`);
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Post('updateUsername')
	async updateUsername(@Req() req: {user: OnlineUser}, @Body() { username, socketId }: UpdateUsernameDTO) {
		const user = req.user;

		return await this.usersService.updateUsername(user.id, username, socketId);
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Post('logout')
	userLogout(@Req() req: {user: OnlineUser}, @Body() {  }: EmptyDTO) {
		const user = req.user;

		const index = this.usersService.onlineUsers.findIndex(usr => usr.id === user.id);
		if (index !== -1) {
			this.usersService.userEvent('logout', this.usersService.onlineUsers[index]);
			this.usersService.onlineUsers.splice(index, 1);
			this.usersService.onlineUsers = this.usersService.onlineUsers.filter(Boolean);
		}
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('local'))
	@Post('login')
	async login(@Req() req: {user: OnlineUser}, @Body() { socketId, code }: LoginDTO) {
		const user = req.user;

		const usr = await this.usersService.findOneById(user.id);
		if (usr.phoneNumber !== null && !isDefined(code)) {
			await this.authService.sendSMS(usr.phoneNumber);
			return { access_token: null as string | null, twoFactorAuthentication: true };
		}
		if (usr.phoneNumber !== null && isDefined(code) && !await this.authService.verifySMS(user.id, usr.phoneNumber, code)) {
			throw new HttpException('Access Denied', HttpStatus.BAD_REQUEST);
		}
		await this.usersService.login(user.id, socketId);
		return this.authService.login(user);
	}
}

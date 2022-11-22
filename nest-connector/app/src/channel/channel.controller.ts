import {
	Body,
	Controller, Get,
	Post, Put, Query,
	Req,
	UseGuards,
	UsePipes,
	ValidationPipe
} from '@nestjs/common';
import { AuthGuard } from "@nestjs/passport";
import { ExpandDTO } from "app.dto";
import {
	CreateChannelDTO,
	JoinChannelDTO, LeaveChannelDTO,
	MuteMemberDTO, UnmuteMemberDTO,
	UpdateChannelDTO,
	UpdateMemberStatusDTO
} from "channel/channel.dto";
import { ChannelService } from "channel/channel.service";
import { isDefined } from "class-validator";

import { OnlineUser } from '../users/users.interface';

@Controller('channels')
export class ChannelController {

	constructor(private channelService: ChannelService) {}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Post('create')
	async createChannel(@Req() req: {user: OnlineUser}, @Body() { name, title, isPrivate, password }: CreateChannelDTO) {
		const user = req.user;

		// todo [name validation]
		return await this.channelService.createChannel(name, title, user.id, isPrivate, password);
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Get()
	async getChannels(@Req() req: {user: OnlineUser}, @Query() { expand }: ExpandDTO) {
		const { user } = req;

		return await this.channelService.getChannels(user.id, isDefined(expand));
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Post('join')
	async joinChannel(@Req() req: {user: OnlineUser}, @Body() { channelId, password }: JoinChannelDTO) {
		const user = req.user;

		return await this.channelService.addMember(channelId, user.id, password);
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Put('updateMemberStatus')
	async updateMemberStatus(@Req() req: {user: OnlineUser}, @Body() { channelId, memberId, status }: UpdateMemberStatusDTO) {
		const user = req.user;

		return await this.channelService.updateMemberStatus(user.id, channelId, memberId, status);
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Post('muteMember')
	async muteMember(@Req() req: {user: OnlineUser}, @Body() { channelId, memberId, unbanDate }: MuteMemberDTO) {
		const user = req.user;

		return await this.channelService.muteMember(user.id, channelId, memberId, unbanDate);
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Post('unmuteMember')
	async unmuteMember(@Req() req: {user: OnlineUser}, @Body() { channelId, memberId }: UnmuteMemberDTO) {
		const user = req.user;

		return await this.channelService.unmuteMember(user.id, channelId, memberId);
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Put('update')
	async update(@Req() req: {user: OnlineUser}, @Body() { channelId, isPrivate, password }: UpdateChannelDTO) {
		const user = req.user;

		if (isDefined(password)) {
			return await this.channelService.updateChannel(user.id, channelId, isPrivate, password);
		}
		return await this.channelService.updateChannel(user.id, channelId, isPrivate);
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Post('leave')
	async leave(@Req() req: {user: OnlineUser}, @Body() { channelId }: LeaveChannelDTO) {
		const user = req.user;

		return await this.channelService.leaveChannel(user.id, channelId);
	}

}

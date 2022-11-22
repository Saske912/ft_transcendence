import { Controller, Get, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from "@nestjs/passport";
import { EmptyDTO } from "app.dto";
import { AddWatcherDTO } from "game/game.dto";
import { GameService } from "game/game.service";

import { OnlineUser } from '../users/users.interface';

@Controller('games')
export class GameController {
	constructor(private gameService: GameService) {}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Get()
	async getGames(@Query() {  }: EmptyDTO) {

		return await this.gameService.getGames();
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Get('watchGame')
	addWatcher(@Req() req: {user: OnlineUser}, @Query() { gamerLogin }: AddWatcherDTO) {
		const user = req.user;

		return { ok: this.gameService.addWatcher(user.id, gamerLogin) };
	}
}

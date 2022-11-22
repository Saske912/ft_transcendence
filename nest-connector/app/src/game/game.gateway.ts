import { Inject } from "@nestjs/common";
import { MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { GameService } from "game/game.service";

@WebSocketGateway({ cors: true })
export class GameGateway {
	@Inject() gameService: GameService;

	@SubscribeMessage('start')
	launchBall(@MessageBody() data: string) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const startData: { login: string, id: string } = JSON.parse(data);
		const game = this.gameService.games.find(g => g.id === startData.id);
		if (!game)
			return;

		if (!game.gameInterval) // чтобы не запускалось 2 интервала, т.к. start отсылают два клиента
			game.gameInterval = setInterval(() => {
				game.updatePositions();

				// Score check
				const score = game.gameSettings.score;
				if (score.leftPlayer >= game.pointsToWin || score.rightPlayer >= game.pointsToWin) {
					const winnerLogin = score.leftPlayer >= game.pointsToWin ? game.leftPlayer.user.login : game.rightPlayer.user.login;
					const loserLogin = score.rightPlayer >= game.pointsToWin ? game.leftPlayer.user.login : game.rightPlayer.user.login;
					const data = {
						winner: winnerLogin
					};
					game.sendMsg('gameResults', JSON.stringify(data));
					this.gameService.updateStatistics(winnerLogin, loserLogin, score)
						.then()
						.catch(() => console.log('[updateStatistics] error'));
					clearInterval(game.gameInterval);
					this.gameService.games = this.gameService.games.filter(g => g.id !== game.id);
					return;
				}

				const gameLoopData = {
					b: game.coordinates.ball,
					lP: game.coordinates.leftPlayer,
					rP: game.coordinates.rightPlayer
				};
				game.sendMsg('gameLoop', JSON.stringify(gameLoopData));
			}, 1000 / game.fps);
	}

	@SubscribeMessage('keyDown')
	keyDownHandler(@MessageBody() data: string) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const event: { login: string, gameId: string, key: string } = JSON.parse(data);
		const game = this.gameService.games.find(g => g.id === event.gameId);
		if (!game)
			return;

		if (game.leftPlayer.user.login === event.login) {
			if (event.key === 'ArrowUp')
				game.leftPlayer.controls.arrowUp = true;
			if (event.key === 'ArrowDown')
				game.leftPlayer.controls.arrowDown = true;
		}
		if (game.rightPlayer.user.login === event.login) {
			if (event.key === 'ArrowUp')
				game.rightPlayer.controls.arrowUp = true;
			if (event.key === 'ArrowDown')
				game.rightPlayer.controls.arrowDown = true;
		}
	}

	@SubscribeMessage('keyUp')
	keyUpHandler(@MessageBody() data: string) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const event: { login: string, gameId: string, key: string } = JSON.parse(data);
		const game = this.gameService.games.find(g => g.id === event.gameId);
		if (!game)
			return;

		if (game.leftPlayer.user.login === event.login) {
			if (event.key === 'ArrowUp')
				game.leftPlayer.controls.arrowUp = false;
			if (event.key === 'ArrowDown')
				game.leftPlayer.controls.arrowDown = false;
		}
		if (game.rightPlayer.user.login === event.login) {
			if (event.key === 'ArrowUp')
				game.rightPlayer.controls.arrowUp = false;
			if (event.key === 'ArrowDown')
				game.rightPlayer.controls.arrowDown = false;
		}
	}

}

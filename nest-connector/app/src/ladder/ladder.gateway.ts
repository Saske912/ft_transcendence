import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { LadderService } from "ladder/ladder.service";
import { Socket } from "socket.io";
import { UsersService } from "users/users.service";

@WebSocketGateway({ cors: true })
export class LadderGateway {

	constructor(
		private usersService: UsersService,
		private ladderService: LadderService
	) {}

	@SubscribeMessage('requestDuel')
	async requestGameHandler(client: Socket, data: string): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const requestGameData: { enemyId: number, chatId: number } = JSON.parse(data);
		const senderLogin = this.usersService.getUsernameBySocketId(client.id);
		// eslint-disable-next-line @typescript-eslint/await-thenable
		const sender = await this.usersService.onlineUsers.find(usr => usr.login === senderLogin);
		// eslint-disable-next-line @typescript-eslint/await-thenable
		const enemy = await this.usersService.onlineUsers.find(usr => usr.id === requestGameData.enemyId);

		if (!sender || !enemy)
			return;

		this.ladderService.addToDuel(sender, enemy, requestGameData.chatId);
		const dataStr = JSON.stringify({ status: 'yellow', chatId: requestGameData.chatId });
		sender.socket.emit('duelStatus', dataStr);
		enemy.socket.emit('duelStatus', dataStr);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	@SubscribeMessage('cancelDuel')
	async cancelDuelHandler(client: Socket, data: string): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const cancelDuelData: { enemyId: number, chatId: number } = JSON.parse(data);
		const senderLogin = this.usersService.getUsernameBySocketId(client.id);
		const sender = this.usersService.onlineUsers.find(usr => usr.login === senderLogin);
		const enemy = this.usersService.onlineUsers.find(usr => usr.id === cancelDuelData.enemyId);

		this.ladderService.cancelDuel(sender, enemy, cancelDuelData.chatId);
	}
}

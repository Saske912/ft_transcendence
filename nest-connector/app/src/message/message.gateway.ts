import { Inject } from "@nestjs/common";
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ChannelService } from "channel/channel.service";
import { ChatService } from "chat/chat.service";
import { MessageService } from "message/message.service";
import { Socket } from "socket.io";
import { UsersService } from "users/users.service";

@WebSocketGateway({ cors: true })
export class MessageGateway {
	@Inject()
	usersService: UsersService;
	@Inject()
	messageService: MessageService;
	@Inject()
	chatService: ChatService;
	@Inject()
	channelService: ChannelService;

	@SubscribeMessage('sendMessage')
	async sendMessageHandler(client: Socket, data: string): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const msgData: { text: string, chatId?: number, channelId?: number } = JSON.parse(data);
		const senderLogin = this.usersService.getUsernameBySocketId(client.id);
		// eslint-disable-next-line @typescript-eslint/await-thenable
		const sender = await this.usersService.onlineUsers.find(usr => usr.login === senderLogin);

		if (!sender)
			return ;

		if (msgData.chatId) {
			const chat = await this.chatService.getChat(msgData.chatId, true);
			if (sender.id !== chat.userOneId && sender.id !== chat.userTwoId)
				return ;
			const ban = chat.banLists.find(list =>
				list.chatId === chat.id && (list.unbanDate === null || new Date(list.unbanDate) > new Date())
			);
			if (ban && ban.memberId === sender.id)
				return ;

			const msg = await this.messageService.createChatMessage(msgData.text, msgData.chatId, sender.id);
			if (msg) {
				const onlineUsrOne = this.usersService.onlineUsers.find(usr => usr.id === chat.userOneId);
				if (onlineUsrOne)
					onlineUsrOne.socket.emit('receiveMessage', JSON.stringify(msg));

				const onlineUsrTwo = this.usersService.onlineUsers.find(usr => usr.id === chat.userTwoId);
				if (onlineUsrTwo)
					onlineUsrTwo.socket.emit('receiveMessage', JSON.stringify(msg));
			}
		} else if (msgData.channelId) {
			const channel = await this.channelService.getChannel(msgData.channelId, true);
			if (!channel)
				return ;
			const member = channel.members.find(m => m.id === sender.id);
			if (!member)
				return ;
			const ban = member.banLists.find(list =>
				list.channelId === msgData.channelId &&
				(list.unbanDate === null || new Date(list.unbanDate) > new Date())
			);
			if (ban) {
				return ;
			}

			const msg = await this.messageService.createChannelMessage(msgData.text, msgData.channelId, sender.id);
			if (msg) {
				if (channel.isPrivate) {
					for (const member of channel.members) {
						const onlineMember = this.usersService.onlineUsers.find(usr => member.id === usr.id);
						if (!onlineMember)
							continue ;
						onlineMember.socket.emit('receiveMessage', JSON.stringify(msg));
					}
				} else {
					this.usersService.broadcastEventData('receiveMessage', JSON.stringify(msg));
				}
			}
		}
	}

}

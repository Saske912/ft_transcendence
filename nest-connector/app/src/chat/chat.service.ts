import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { ChatEntity } from "chat/chat.entity";
import { Repository } from "typeorm";
import { UsersService } from "users/users.service";

import { BanListsService } from "../ban-lists/ban-lists.service";

@Injectable()
export class ChatService {
	@InjectRepository(ChatEntity)
	private chatRepository: Repository<ChatEntity>;
	@Inject()
	private usersService: UsersService;
	@Inject()
	private banListsService: BanListsService;

	async createChat(userOneId: number, userTwoId: number): Promise<ChatEntity> {
		if (userOneId === userTwoId)
			throw new HttpException('Cannot create chat', HttpStatus.BAD_REQUEST);

		// Check if chat already exists
		if (await this.chatRepository.findOne({ where: { userOneId: userOneId, userTwoId: userTwoId } }))
			throw new HttpException('Chat already exists', HttpStatus.BAD_REQUEST);
		if (await this.chatRepository.findOne({ where: { userOneId: userTwoId, userTwoId: userOneId } }))
			throw new HttpException('Chat already exists', HttpStatus.BAD_REQUEST);

		try {
			const chat = this.chatRepository.create();
			chat.userOneId = userOneId;
			chat.userTwoId = userTwoId;
			const r = await this.chatRepository.save(chat);

			void this.getChat(r.id, true)
				.then((chat) => {
					const data = JSON.stringify(chat);
					const u1 = this.usersService.onlineUsers.find(usr => usr.id === r.userOneId);
					if (u1)
						u1.socket.emit('newChat', data);
					const u2 = this.usersService.onlineUsers.find(usr => usr.id === r.userTwoId);
					if (u2)
						u2.socket.emit('newChat', data);
				});

			return r;
		} catch (e) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			throw new HttpException(e.detail, HttpStatus.BAD_REQUEST);
		}
	}

	async getChats(userId: number, expand: boolean): Promise<ChatEntity[]> {
		const chats: ChatEntity[] = [];
		let r1: ChatEntity[];
		let r2: ChatEntity[];

		if (expand) {
			r1 = await this.chatRepository.find({ where: { userOneId: userId }, relations: ['userOne', 'userTwo', 'messages', 'banLists'] });
			r2 = await this.chatRepository.find({ where: { userTwoId: userId }, relations: ['userOne', 'userTwo', 'messages', 'banLists'] });
		} else {
			r1 = await this.chatRepository.find({ where: { userOneId: userId } });
			r2 = await this.chatRepository.find({ where: { userTwoId: userId } });
		}

		for (let i = 0; i < r1.length; ++i)
			chats.push(r1[i]);
		for (let i = 0; i < r2.length; ++i)
			chats.push(r2[i]);

		if (expand)
			for (let i = 0; i < chats.length; ++i)
				chats[i].messages.sort((msg1, msg2) => msg1.date - msg2.date);

		return chats;
	}

	async getChat(id: number, expand = false): Promise<ChatEntity> {
		if (expand) {
			const r = await this.chatRepository.findOne({ where: { id: id }, relations: ['userOne', 'userTwo', 'messages', 'banLists'] });
			r.messages.sort((msg1, msg2) => msg1.date - msg2.date);
			return r;
		}
		return await this.chatRepository.findOne({ where: { id: id } });
	}

	updateChats(initiatorId: number, memberId: number) {
		const initiator = this.usersService.onlineUsers.find(usr => usr.id === initiatorId);
		if (initiator) {
			void this.getChats(initiatorId, true)
				.then((chats) => initiator.socket.emit('updateChats', JSON.stringify(chats)));
		}
		const member = this.usersService.onlineUsers.find(usr => usr.id === memberId);
		if (member) {
			void this.getChats(memberId, true)
				.then((chats) => member.socket.emit('updateChats', JSON.stringify(chats)));
		}
	}

	async muteMember(initiatorId: number, chatId: number, memberId: number, unbanDate: string | null) {
		const chat = await this.getChat(chatId);
		if (!chat)
			throw new HttpException('Chat not found', HttpStatus.BAD_REQUEST);
		if (
			!(chat.userOneId === initiatorId && chat.userTwoId === memberId ||
			chat.userOneId === memberId && chat.userTwoId === initiatorId)
		)
			throw new HttpException('Access denied', HttpStatus.BAD_REQUEST);

		const r = await this.banListsService.muteMember(chatId, null, initiatorId, memberId, unbanDate);
		// eslint-disable-next-line @typescript-eslint/await-thenable
		await this.updateChats(initiatorId, memberId);
		return r;
	}

	async unmuteMember(initiatorId: number, chatId: number, memberId: number) {
		const chat = await this.getChat(chatId);
		if (!chat)
			throw new HttpException('Chat not found', HttpStatus.BAD_REQUEST);
		if (
			!(chat.userOneId === initiatorId && chat.userTwoId === memberId ||
				chat.userOneId === memberId && chat.userTwoId === initiatorId)
		)
			throw new HttpException('Access denied', HttpStatus.BAD_REQUEST);

		const r = await this.banListsService.unmuteMember(chatId, null, initiatorId, memberId);
		// eslint-disable-next-line @typescript-eslint/await-thenable
		await this.updateChats(initiatorId, memberId);
		return r;
	}
}

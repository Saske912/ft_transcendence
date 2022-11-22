import {
	Body,
	Controller,
	Get,
	Inject,
	Post,
	Query,
	Req,
	UseGuards,
	UsePipes, ValidationPipe
} from '@nestjs/common';
import { AuthGuard } from "@nestjs/passport";
import { ExpandDTO } from "app.dto";
import { CreateChatDTO, MuteChatMemberDTO, UnmuteChatMemberDTO } from "chat/chat.dto";
import { ChatEntity } from "chat/chat.entity";
import { ChatService } from "chat/chat.service";
import { isDefined } from "class-validator";

import { OnlineUser } from '../users/users.interface';

@Controller('chats')
export class ChatController {
	@Inject()
	private chatService: ChatService;

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Post('create')
	async createChat(@Req() req: {user: OnlineUser}, @Body() { userTwoId }: CreateChatDTO) {
		const user = req.user;

		return await this.chatService.createChat(user.id, userTwoId);
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Get()
	async getChats(@Req() req: {user: OnlineUser}, @Query() { expand }: ExpandDTO): Promise<ChatEntity[]> {
		const user = req.user;

		return await this.chatService.getChats(user.id, isDefined(expand));
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Post('muteMember')
	async muteMember(@Req() req: {user: OnlineUser}, @Body() { chatId, memberId, unbanDate }: MuteChatMemberDTO) {
		const user = req.user;

		return await this.chatService.muteMember(user.id, chatId, memberId, unbanDate);
	}

	@UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
	@UseGuards(AuthGuard('jwt'))
	@Post('unmuteMember')
	async unmuteMember(@Req() req: {user: OnlineUser}, @Body() { chatId, memberId }: UnmuteChatMemberDTO) {
		const user = req.user;

		return await this.chatService.unmuteMember(user.id, chatId, memberId);
	}

}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { BanListsEntity } from "ban-lists/ban-lists.entity";
import { Repository } from "typeorm";

@Injectable()
export class BanListsService {

	@InjectRepository(BanListsEntity)
	private banListsRepository: Repository<BanListsEntity>;

	async muteMember(chatId: number | null, channelId: number | null, initiatorId: number, memberId: number, unbanDate: string | null) {
		try {
			const ban = this.banListsRepository.create();
			ban.initiatorId = initiatorId;
			ban.memberId = memberId;
			if (chatId !== null) {
				ban.chatId = chatId;
			} else if (channelId !== null) {
				ban.channelId = channelId;
			}
			ban.unbanDate = unbanDate === null ? null : new Date(unbanDate);
			return await this.banListsRepository.save(ban);
		} catch (e) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			throw new HttpException(e.detail, HttpStatus.BAD_REQUEST);
		}
	}

	async unmuteMember(chatId: number | null, channelId: number | null, initiatorId: number | null, memberId: number) {
		try {
			if (chatId !== null) {
				const bans = await this.banListsRepository.find({ where: { initiatorId, memberId, chatId } });
				return await this.banListsRepository.remove(bans);
			} else if (channelId !== null) {
				const bans = await this.banListsRepository.find({ where: { memberId, channelId } });
				return await this.banListsRepository.remove(bans);
			}
		} catch (e) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			throw new HttpException(e.detail, HttpStatus.BAD_REQUEST);
		}
		throw new Error('Unhandled');
	}

}

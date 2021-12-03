import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import * as bcryptjs from 'bcryptjs';
import { ChannelEntity } from "channel/entities/channel.entity";
import { ChannelMemberEntity } from "channel/entities/channelMember.entity";
import { Repository } from "typeorm";
import { UsersService } from "users/users.service";

@Injectable()
export class ChannelService {

	@InjectRepository(ChannelEntity)
	private channelRepository: Repository<ChannelEntity>;

	@InjectRepository(ChannelMemberEntity)
	private channelMemberRepository: Repository<ChannelMemberEntity>;

	@Inject()
	private usersService: UsersService;

	async createChannel(name: string, title: string, ownerId: number, isPrivate: boolean, password?: string): Promise<ChannelEntity> {
		try {
			const channel = this.channelRepository.create();
			channel.name = name;
			channel.title = title;
			channel.ownerId = ownerId;
			channel.isPrivate = isPrivate;
			if (password)
				channel.password = password;
			const res = await this.channelRepository.save(channel);
			await this.addMember(res.id, ownerId);

			const data = await this.getChannel(channel.id, true);
			this.usersService.broadcastEventData('newChannel', JSON.stringify(data));

			return res;
		} catch (e) {
			throw new HttpException(e.detail, HttpStatus.BAD_REQUEST);
		}
	}

	async addMember(channelId: number, userId: number, password: string | null = null): Promise<ChannelMemberEntity> {
		const m = await this.channelMemberRepository.findOne({ where: { channelId: channelId, userId: userId } });
		if (m)
			return m;
		const channel = await this.getChannel(channelId);
		if (channel.isPrivate) {
			if (!bcryptjs.compareSync(password, channel.password)) {
				throw new HttpException('Wrong password', HttpStatus.BAD_REQUEST);
			}
		}

		try {
			const member = this.channelMemberRepository.create();
			member.channelId = channelId;
			member.userId = userId;
			const r = await this.channelMemberRepository.save(member);
			this.usersService.broadcastEventData('updateChannel', '');
			return r;
		} catch (e) {
			throw new HttpException(e.detail, HttpStatus.BAD_REQUEST);
		}
	}

	async getChannel(id: number, expand = false): Promise<ChannelEntity> {
		if (expand) {
			const r = await this.channelRepository.findOne({ where: { id: id }, relations: ['owner', 'members', 'messages'] });
			r.messages.sort((msg1, msg2) => msg1.date - msg2.date);
			return r;
		}
		return await this.channelRepository.findOne({ where: { id: id } });
	}

	async getChannels(userId: number, expand = false): Promise<ChannelEntity[]> {
		if (expand) {
			const r = await this.channelRepository.find({ relations: ['owner', 'members', 'messages'] });
			for (const channel of r) {
				if (channel.isPrivate && !channel.members.find(member => member.id === userId)) {
					channel.messages = [];
				} else {
					channel.messages.sort((msg1, msg2) => msg1.date - msg2.date);
				}
			}
			return r;
		}
		return await this.channelRepository.find();
	}

}

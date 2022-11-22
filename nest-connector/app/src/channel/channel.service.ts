import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { BanListsService } from "ban-lists/ban-lists.service";
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

	@Inject()
	private banListsService: BanListsService;

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
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			throw new HttpException(e.detail, HttpStatus.BAD_REQUEST);
		}
	}

	updateChannelEvent() {
		for (const user of this.usersService.onlineUsers) {
			// const usr = await this.usersService.findOneById(user.id, true);
			// const data = JSON.stringify({
			// 	channels: usr?.channels || [],
			// 	allChannels: await this.getChannels(user.id, true),
			// });
			user.socket.emit('updateChannel', '');
		}
	}

	async addMember(channelId: number, userId: number, password: string | null = null): Promise<ChannelMemberEntity> {
		const m = await this.channelMemberRepository.findOne({ where: { channelId: channelId, userId: userId } });
		if (m)
			return m;
		const channel = await this.getChannel(channelId);
		if (channel.isPrivate) {
			if (channel.ownerId !== userId && !bcryptjs.compareSync(password, channel.password)) {
				throw new HttpException('Wrong password', HttpStatus.BAD_REQUEST);
			}
		}

		try {
			const member = this.channelMemberRepository.create();
			member.channelId = channelId;
			member.userId = userId;
			if (userId === channel.ownerId)
				member.isAdmin = true;
			const r = await this.channelMemberRepository.save(member);
			this.updateChannelEvent();
			return r;
		} catch (e) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			throw new HttpException(e.detail, HttpStatus.BAD_REQUEST);
		}
	}

	async getChannel(id: number, expand = false): Promise<ChannelEntity> {
		if (expand) {
			const r = await this.channelRepository.findOne({ where: { id: id }, relations: ['owner', 'members', 'messages', 'memberEntities', 'memberEntities.user', 'members.banLists'] });
			r.messages.sort((msg1, msg2) => msg1.date - msg2.date);
			return r;
		}
		return await this.channelRepository.findOne({ where: { id: id } });
	}

	// TODO to much time complexity
	async getChannels(userId: number, expand = false) {
		if (expand) {
			const r = await this.channelRepository.find({ relations: ['owner', 'members', 'messages', 'memberEntities', 'memberEntities.user', 'members.banLists'] });
			for (const channel of r) {
				if (channel.isPrivate && !channel.members.find(member => member.id === userId)) {
					channel.messages = [];
				} else {
					channel.messages.sort((msg1, msg2) => msg1.date - msg2.date);
				}
				for (let i = 0; i < channel.memberEntities.length; ++i) {
					channel.members[i].isAdmin = channel.memberEntities.find(m => m.userId === channel.members[i].id)?.isAdmin || false;
				}
				for (const member of channel.members) delete member.password;
				delete channel.memberEntities;
			}
			return r;
		}
		return await this.channelRepository.find();
	}

	async updateMemberStatus(userId: number, channelId: number, memberId: number, status: string) {
		const channel = await this.getChannel(channelId, true);
		if (!channel || channel.ownerId !== userId)
			throw new HttpException('Access denied', HttpStatus.BAD_REQUEST);
		const member = channel.memberEntities.find(m => m.userId === memberId);
		if (!member)
			throw new HttpException('No member', HttpStatus.BAD_REQUEST);

		if (status === 'admin')
			member.isAdmin = true;
		else if (status === 'member')
			member.isAdmin = false;
		const r = await this.channelMemberRepository.save(member);
		this.updateChannelEvent();
		return r;
	}

	async muteMember(initiatorId: number, channelId: number, memberId: number, unbanDate: string | null) {
		const channel = await this.getChannel(channelId, true);
		if (!channel)
			throw new HttpException('Channel not found', HttpStatus.BAD_REQUEST);
		const initiator = channel.memberEntities.find(m => m.userId === initiatorId);
		if (!initiator || !initiator.isAdmin)
			throw new HttpException('Access denied', HttpStatus.BAD_REQUEST);

		const r = await this.banListsService.muteMember(null, channel.id, initiatorId, memberId, unbanDate);
		this.updateChannelEvent();
		return r;
	}

	async unmuteMember(initiatorId: number, channelId: number, memberId: number) {
		const channel = await this.getChannel(channelId, true);
		if (!channel)
			throw new HttpException('Channel not found', HttpStatus.BAD_REQUEST);
		const initiator = channel.memberEntities.find(m => m.userId === initiatorId);
		if (!initiator || !initiator.isAdmin)
			throw new HttpException('Access denied', HttpStatus.BAD_REQUEST);

		const r = await this.banListsService.unmuteMember(null, channel.id, null, memberId);
		this.updateChannelEvent();
		return r;
	}

	async updateChannel(userId: number, channelId: number, isPrivate: boolean, password: string | null = null) {
		const channel = await this.getChannel(channelId, true);
		if (!channel)
			throw new HttpException('Channel not found', HttpStatus.BAD_REQUEST);
		if (channel.ownerId !== userId)
			throw new HttpException('Access denied', HttpStatus.BAD_REQUEST);

		channel.isPrivate = isPrivate;
		if (isPrivate && password) {
			channel.password = password;
		}
		const r = await this.channelRepository.save(channel);
		this.updateChannelEvent();
		return r;
	}

	async leaveChannel(userId: number, channelId: number) {
		const channel = await this.getChannel(channelId, true);
		if (!channel)
			throw new HttpException('Channel not found', HttpStatus.BAD_REQUEST);
		if (channel.ownerId === userId)
			throw new HttpException('Owner cannot leave his channel', HttpStatus.BAD_REQUEST);

		const r = await this.channelMemberRepository.delete({ channelId, userId });
		this.updateChannelEvent();
		return r;
	}

}

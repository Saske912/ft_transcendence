import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AvatarGenerator } from 'random-avatar-generator';
import { Socket } from "socket.io";
import { DeleteResult, Repository } from 'typeorm';
import { UserSubscription } from "users/entities/subscription.entity";
import { User } from 'users/entities/user.entity';
import { OnlineUser } from 'users/users.interface';

@Injectable()
export class UsersService {
	public onlineUsers: OnlineUser[];

	/**
	 * UsersService usersSocketIds Map
	 * - key - socket id
	 * - value - username
	 */
	private usersSocketIds: Map<string, string>;

	/**
	 * UsersService sockets Map
	 * - key - socket id
	 * - value - Socket
	 */
	private sockets: Map<string, Socket>;

	private readonly allRelations = [
		'wonGames',
		'lostGames',
		'subscriptions',
		'subscribers',
		'createdChats',
		'acceptedChats',
		'messages',
		'ownedChannels',
		'channels',
		'channels.messages',
		'channels.members',
		'channels.members.banLists',
	];

	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
		@InjectRepository(UserSubscription)
		private userSubscriptionRepository: Repository<UserSubscription>,
	) {
		this.onlineUsers = [];
		this.usersSocketIds = new Map<string, string>();
		this.sockets = new Map<string, Socket>();
	}

	async findAll(expand = false): Promise<User[]> {
		if (!expand)
			return await this.usersRepository.find();

		const users = await this.usersRepository.find({ relations: this.allRelations });
		for (let i = 0; i < users.length; ++i) {
			const subscriptionsExpand: any = [];
			for (let j = 0; j < users[i].subscriptions.length; ++j) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
				subscriptionsExpand.push(await this.findOneById(users[i].subscriptions[j].targetId, false));
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			users[i].subscriptions = subscriptionsExpand;

			const subscribersExpand: any = [];
			for (let j = 0; j < users[i].subscribers.length; ++j)
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
				subscribersExpand.push(await this.findOneById(users[i].subscribers[j].userId, false));
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			users[i].subscribers = subscribersExpand;
		}
		return users;
	}

	async findOneByLogin(login: string, expand = false) {
		if (expand)
			return await this.usersRepository.findOne({ where: { login: login }, relations: this.allRelations });
		return await this.usersRepository.findOne({ where: { login: login } });
	}

	async findOneByIntraLogin(login: string, expand = false) {
		if (expand)
			return await this.usersRepository.findOne({ where: { intraLogin: login }, relations: this.allRelations });
		return await this.usersRepository.findOne({ where: { intraLogin: login } });
	}

	async findOneById(id: number, expand = false): Promise<User> {
		if (expand)
			return await this.usersRepository.findOne({ where: { id: id }, relations: this.allRelations });
		return await this.usersRepository.findOne({ where: { id: id } });
	}

	async subscribeToUser(userId: number, targetLogin: string): Promise<UserSubscription> {
		const user = await this.findOneById(userId, true);
		if (!user)
			throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
		const target = await this.findOneByLogin(targetLogin);
		if (!target)
			throw new HttpException('Target not found', HttpStatus.BAD_REQUEST);

		if (user.subscriptions.find(s => s.targetId === target.id))
			throw new HttpException('Already subscribed', HttpStatus.BAD_REQUEST);

		const subscription = this.userSubscriptionRepository.create();
		subscription.user = user;
		subscription.target = target;
		const r = await this.userSubscriptionRepository.save(subscription);
		if (r) {
			const onlineUser = this.onlineUsers.find(usr => usr.id === user.id);
			if (onlineUser) {
				onlineUser.subscriptions.push(target);
				// this.userEvent('updateUser', onlineUser);
				this.updateUser();
			}

			const onlineTarget = this.onlineUsers.find(usr => usr.id === target.id);
			if (onlineTarget) {
				onlineTarget.subscribers.push(user);
				// this.userEvent('updateUser', onlineTarget);
				this.updateUser();
			}
		}
		return r;
	}

	async unsubscribeFromUser(userId: number, targetLogin: string): Promise<DeleteResult> {
		const user = await this.findOneById(userId, true);
		if (!user)
			throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
		const target = await this.findOneByLogin(targetLogin);
		if (!target)
			throw new HttpException('Target not found', HttpStatus.BAD_REQUEST);

		if (!user.subscriptions.find(s => s.targetId === target.id))
			throw new HttpException('Already unsubscribed', HttpStatus.BAD_REQUEST);

		const r = await this.userSubscriptionRepository.delete({ userId: user.id, targetId: target.id });
		if (r) {
			const onlineUser = this.onlineUsers.find(usr => usr.id === user.id);
			if (onlineUser) {
				onlineUser.subscriptions = onlineUser.subscriptions.filter(s => s.id !== target.id);
				// this.userEvent('updateUser', onlineUser);
				this.updateUser();
			}

			const onlineTarget = this.onlineUsers.find(usr => usr.id === target.id);
			if (onlineTarget) {
				onlineTarget.subscribers = onlineTarget.subscribers.filter(s => s.id !== user.id);
				// this.userEvent('updateUser', onlineTarget);
				this.updateUser();
			}
		}
		return r;
	}

	async createLocal(login: string, password: string, urlAvatar: string | null) {
		const user = this.usersRepository.create();
		user.password = password;
		user.login = login;
		if (!urlAvatar) {
			const generator = new AvatarGenerator();
			user.url_avatar = generator.generateRandomAvatar(Math.random().toString());
		} else {
			user.url_avatar = urlAvatar;
		}
		return await this.usersRepository.manager.save(user);
	}

	private async generateLogin(intraLogin: string) {
		if (!await this.findOneByLogin(intraLogin))
			return intraLogin;

		let i = 1;
		while (true) {
			if (!await this.findOneByLogin(`${intraLogin}_${i}`))
				return `${intraLogin}_${i}`;
			++i;
		}
	}

	async createIntra(intraLogin: string, urlAvatar: string) {
		const user = this.usersRepository.create();
		user.login = await this.generateLogin(intraLogin);
		user.intraLogin = intraLogin;
		user.url_avatar = urlAvatar;
		return await this.usersRepository.manager.save(user);
	}

	userEvent(event: string, user: OnlineUser) {
		if (!user)
			return ;

		const data = UsersService.onlineUserToJson(user);

		for (let i = 0; i < this.onlineUsers.length; ++i) {
			this.onlineUsers[i].socket.emit(event, JSON.stringify(data));
		}
	}

	updateUser() {
		const data = JSON.stringify(this.onlineUsers.map(usr => UsersService.onlineUserToJson(usr)));
		for (const user of this.onlineUsers) {
			user.socket.emit('updateUser', data);
		}
	}

	broadcastEventData(event: string, data: string) {
		for (let i = 0; i < this.onlineUsers.length; ++i) {
			this.onlineUsers[i].socket.emit(event, data);
		}
	}

	async login(userId: number, socketId: string) {
		const user = await this.findOneById(userId, true);
		if (!user)
			return { ok: false, msg: 'User not found' };

		this.usersSocketIds.set(socketId, user.login);
		const newUser: OnlineUser = {
			id: user.id,
			login: user.login,
			socket: this.sockets.get(socketId),
			url_avatar: user.url_avatar,
			phoneNumber: user.phoneNumber,
			status: 'green',
			subscribers: [],
			subscriptions: []
		};
		for (let i = 0; i < user.subscriptions.length; ++i)
			newUser.subscriptions.push(await this.findOneById(user.subscriptions[i].targetId));
		for (let i = 0; i < user.subscribers.length; ++i)
			newUser.subscribers.push(await this.findOneById(user.subscribers[i].userId));
		const index = this.onlineUsers.findIndex(usr => usr.login === user.login);
		if (index === -1)
			this.onlineUsers.push(newUser);
		else
			this.onlineUsers[index] = newUser;
		this.updateUser();
		return { ok: true };
	}

	async uploadAvatar(userId: number, urlAvatar: string) {
		const user = await this.findOneById(userId, true);
		user.url_avatar = urlAvatar;
		const r = await this.usersRepository.save(user);

		const onlineUser = this.onlineUsers.find(usr => usr.id === userId);
		onlineUser.url_avatar = urlAvatar;
		// this.userEvent('updateUser', onlineUser);
		this.updateUser();
		return r;
	}

	async updateAvatar(userId: number, urlAvatar: string) {
		const user = await this.findOneById(userId, true);
		user.url_avatar = urlAvatar;
		const r = await this.usersRepository.save(user);

		const onlineUser = this.onlineUsers.find(usr => usr.id === userId);
		onlineUser.url_avatar = urlAvatar;
		// this.userEvent('updateUser', onlineUser);
		this.updateUser();
		return r;
	}

	async updateUsername(userId: number, username: string, socketId: string) {
		const user = await this.findOneById(userId, true);
		user.login = username;
		const r = await this.usersRepository.save(user);

		this.usersSocketIds.set(socketId, r.login);
		const onlineUser = this.onlineUsers.find(usr => usr.id === userId);
		onlineUser.login = r.login;
		this.updateUser();
		return r;
	}

	async savePhoneNumber(user: User, phoneNumber: string) {
		if ((await this.usersRepository.find({ where: { phoneNumber: phoneNumber } })).length !== 0) {
			throw new HttpException('Phone number is busy', HttpStatus.BAD_REQUEST);
		}

		user.phoneNumber = phoneNumber;
		const r = await this.usersRepository.save(user);
		this.updateUser();
		return r;
	}

	async disable2FA(userId: number) {
		const user = await this.findOneById(userId);
		user.phoneNumber = null;
		const r = await this.usersRepository.save(user);
		this.updateUser();
		return r;
	}

	handleConnection(socket: Socket) {
		this.usersSocketIds.set(socket.id, '');
		this.sockets.set(socket.id, socket);
	}

	handleDisconnect(socket: Socket) {
		if (this.usersSocketIds.get(socket.id)) {
			const disconnectedLogin = this.usersSocketIds.get(socket.id);
			this.userEvent('logout', this.onlineUsers.find(usr => usr.login === disconnectedLogin));
			this.onlineUsers = this.onlineUsers.filter(usr => usr.login !== disconnectedLogin);
		}
		this.usersSocketIds.delete(socket.id);
		this.sockets.delete(socket.id);
	}

	getUsernameBySocketId(socketId: string): string {
		return this.usersSocketIds.get(socketId);
	}

	public static onlineUserToJson(user: OnlineUser) {
		return {
			id: user.id,
			login: user.login,
			url_avatar: user.url_avatar,
			status: user.status,
			subscriptions: user.subscriptions,
			subscribers: user.subscribers
		};
	}
}

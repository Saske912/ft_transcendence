import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Game } from 'game/Game';
import { Gamer } from 'game/game.interface';
import { GameService } from 'game/game.service';
import { Duel, Ladder } from 'ladder/ladder.interface';
import { OnlineUser } from 'users/users.interface';
import { UsersService } from 'users/users.service';

@Injectable()
export class LadderService {
	public lobby: Ladder[] = [];
	public lobbyId = 0;
	private duelLobby: Duel[] = [];

	constructor(
		@Inject(UsersService)
		private usersService: UsersService,
		@Inject(GameService)
		private gameService: GameService,
	) {
	}

	traceLadder(login: string) {
		let i = 0;
		while (i < this.lobby.length) {
			if (
				(this.lobby[i].first && this.lobby[i].first.login === login) ||
				(this.lobby[i].second && this.lobby[i].second.login === login)
			) {
				break;
			}
			++i;
		}
		if (i !== this.lobby.length) {
			this.findAnotherLobby(i);
		}
	}

	updateStatus(userId: number, status: string) {
		const user = this.usersService.onlineUsers.find(usr => usr.id === userId);
		if (!user)
			throw new HttpException('Cannot find user', HttpStatus.BAD_REQUEST);

		if (status === 'blue')
			user.status = 'green';
		else
			user.status = status;
		// this.usersService.userEvent('updateUser', user);
		this.usersService.updateUser();
		if (status === 'yellow') {
			this.addToLadder(user);
		} else if (status === 'green') {
			this.removeFromLadder(user, this.sendSingleEvents.bind(this));
		} else if (status === 'blue') {
			this.removeFromLadder(user, this.awayFromKeyboard.bind(this));
		} else if (status === 'red') {
			this.gameStart(user);
		}
	}

	gameStart(user: OnlineUser) {
		this.userPersonalEvent('enemyIsReady', user, user.login);
		let k = 0;
		while (k < this.lobby.length) {
			if (this.lobby[k].first && this.lobby[k].second &&
				(this.lobby[k].first.login === user.login || this.lobby[k].second.login === user.login) &&
				this.lobby[k].first.status === 'red' && this.lobby[k].second.status === 'red'
			) {
				this.updateStatus(this.lobby[k].first.id, 'inGame');
				this.updateStatus(this.lobby[k].second.id, 'inGame');
				this.userPersonalEvent('gameIsReady', null, this.lobby[k].first.login);
				this.userPersonalEvent('gameIsReady', null, this.lobby[k].second.login);
				this.gameService.startGame(this.buildGame(this.lobby[k].first, this.lobby[k].second));
			}
			++k;
		}
	}

	buildGame(first: OnlineUser, second: OnlineUser): Game {
		const gamer1: Gamer = {
			user: first,
			gamePoints: 0,
			platformWide: 10,
			platformSpeed: 1,
			position: 50,
			controls: {
				arrowUp: false,
				arrowDown: false,
			},
		};
		const gamer2: Gamer = {
			user: second,
			gamePoints: 0,
			platformWide: 10,
			platformSpeed: 1,
			position: 50,
			controls: {
				arrowUp: false,
				arrowDown: false,
			},
		};
		++this.lobbyId;
		return new Game(gamer1, gamer2);
	}

	awayFromKeyboard(userIndex: number) {
		this.lobby[userIndex].first.status = 'yellow';
		// this.usersService.userEvent('updateUser', this.lobby[userIndex].first);
		this.usersService.updateUser();
	}

	addToLadder(user: OnlineUser) {
		let i = 0;
		let userInLadder = false;
		while (!userInLadder) {
			if (!this.lobby[i] || !this.lobby[i].first) {
				this.lobby[i] = { first: user, second: null };
				userInLadder = true;
			} else if (!this.lobby[i].second) {
				this.lobby[i].second = user;
				userInLadder = true;
				this.sendEvents(i);
			}
			++i;
		}
	}

	sendEvents(i: number) {
		this.lobby[i].first.status = 'orange';
		this.lobby[i].second.status = 'orange';
		// this.usersService.userEvent('updateUser', this.lobby[i].first);
		// this.usersService.userEvent('updateUser', this.lobby[i].second);
		this.usersService.updateUser();
		this.userPersonalEvent(
			'enemy',
			this.lobby[i].first,
			this.lobby[i].second.login,
		);
		this.userPersonalEvent(
			'enemy',
			this.lobby[i].second,
			this.lobby[i].first.login,
		);
	}

	userPersonalEvent(event: string, user: OnlineUser, login: string) {
		let i = 0;
		while (i < this.usersService.onlineUsers.length) {
			if (this.usersService.onlineUsers[i].login === login) {
				let data;
				if (user) {
					data = JSON.stringify({
						id: user.id,
						login: user.login,
						url_avatar: user.url_avatar,
						status: user.status,
						subscriptions: user.subscriptions,
						subscribers: user.subscribers
					});
				} else {
					data = false;
				}
				this.usersService.onlineUsers[i].socket.emit(event, data);
			}
			++i;
		}
	}

	// private gameStop() {
	//   console.log('[gameStop]');
	//   for (let j = 0; j < this.lobby.length; ++j) {
	//     for (let k = 0; k < this.gameService.games.length; ++k) {
	//       const game = this.gameService.games[k];
	//       if (game.leftPlayer.user.login === this.lobby[j].first?.login || game.leftPlayer.user.login === this.lobby[j].second?.login ||
	//           game.rightPlayer.user.login === this.lobby[j].first?.login || game.rightPlayer.user.login === this.lobby[j].second?.login) {
	//         clearInterval(game.gameInterval);
	//       }
	//     }
	//   }
	// }

	removeFromLadder(user: OnlineUser, func: (i: number) => void) {
		let i = 0;
		while (i < this.lobby.length) {
			if (this.lobby[i].first && this.lobby[i].first.login === user.login) {
				this.lobby[i].first = null;
				if (this.lobby[i].second) {
					this.lobby[i].first = this.lobby[i].second;
					this.lobby[i].second = null;
					func(i);
					// this.gameStop();
				} else {
					// this.gameStop();
					this.lobby = this.lobby.filter(function (val) {
						return val.first !== null || val.second !== null;
					});
				}
				break;
			} else if (
				this.lobby[i].second &&
				this.lobby[i].second.login === user.login
			) {
				this.lobby[i].second = null;
				if (this.lobby[i].first) {
					// this.gameStop();
					func(i);
				} else {
					// this.gameStop();
					this.lobby = this.lobby.filter(function (val) {
						return val.first !== null || val.second !== null;
					});
				}
				// Game Stop
				for (let j = 0; j < this.lobby.length; ++j) {
					for (let k = 0; k < this.gameService.games.length; ++k) {
						const game = this.gameService.games[k];
						if (game.leftPlayer.user.login === this.lobby[j].first?.login || game.rightPlayer.user.login === this.lobby[j].second?.login)
							clearInterval(game.gameInterval);
					}
				}
				break;
			}
			++i;
		}
	}

	sendSingleEvents(userIndex: number) {
		this.lobby[userIndex].first.status = 'yellow';
		// this.usersService.userEvent('updateUser', this.lobby[userIndex].first);
		this.usersService.updateUser();
		this.userPersonalEvent('enemy', null, this.lobby[userIndex].first.login);
	}

	findAnotherLobby(userIndex: number): boolean {
		let k = 0;
		while (k < this.lobby.length) {
			if (k != userIndex) {
				if (this.lobby[k].first && !this.lobby[k].second) {
					this.lobby[k].second = this.lobby[userIndex].first;
					this.lobby[userIndex].first = null;
					this.sendEvents(k);
					return true;
				} else if (!this.lobby[k].first && this.lobby[k].second) {
					this.lobby[k].first = this.lobby[userIndex].first;
					this.lobby[userIndex].first = null;
					this.sendEvents(k);
					return true;
				}
			}
			++k;
		}
		return false;
	}

	addToDuel(user: OnlineUser, enemy: OnlineUser, chatId: number): Ladder {
		const duel = this.duelLobby.find(d => d.chatId === chatId);
		if (duel) {
			duel.first = user;
			duel.second = enemy;
			if (duel.first && duel.second) {
				this.updateStatus(duel.first.id, 'inGame');
				this.updateStatus(duel.second.id, 'inGame');
				duel.first.socket.emit('enemy', JSON.stringify(UsersService.onlineUserToJson(duel.second)));
				duel.second.socket.emit('enemy', JSON.stringify(UsersService.onlineUserToJson(duel.first)));
				duel.first.socket.emit('gameIsReady', '');
				duel.second.socket.emit('gameIsReady', '');
				this.gameService.startGame(this.buildGame(duel.first, duel.second));
			}
			return duel;
		}
		const newDuel: {chatId: number, first: OnlineUser | null, second: OnlineUser | null} = {
			chatId,
			first: user,
			second: null
		};
		this.duelLobby.push(newDuel);
		return newDuel;
	}

	cancelDuel(user: OnlineUser, enemy: OnlineUser, chatId: number) {
		if (user)
			user.socket.emit('duelStatus', JSON.stringify({ status: 'green', chatId: chatId }));
		if (enemy)
			enemy.socket.emit('duelStatus', JSON.stringify({ status: 'green', chatId: chatId }));
		this.duelLobby = this.duelLobby.filter(d => d.chatId !== chatId);
	}
}

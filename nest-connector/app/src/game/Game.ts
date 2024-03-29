import { Gamer } from 'game/game.interface';
import { OnlineUser } from "users/users.interface";
import { v4 as uuidv4 } from 'uuid';

export class Game {
	public id = uuidv4();
	public gameInterval: NodeJS.Timer | null = null;
	public readonly coordinates = {
		leftPlayer: {
			y: 0,
		},
		rightPlayer: {
			y: 0,
		},
		ball: {
			x: 0,
			y: 0,
		},
	};
	public readonly fps = 60;
	public readonly pointsToWin = 11;
	public readonly gameSettings = {
		id: this.id,
		canvasWidth: 1024,
		canvasHeight: 600,
		playerWidth: 15,
		playerMargin: 15,
		playerHeight: 100,
		playerStep: 8,
		ballSize: 15,
		ballAngle: 0,
		ballSpeed: 11,
		fps: this.fps,
		leftPlayer: {
			id: this.leftPlayer.user.id,
			login: this.leftPlayer.user.login,
			url_avatar: this.leftPlayer.user.url_avatar,
			status: this.leftPlayer.user.status
		},
		rightPlayer: {
			id: this.rightPlayer.user.id,
			login: this.rightPlayer.user.login,
			url_avatar: this.rightPlayer.user.url_avatar,
			status: this.rightPlayer.user.status
		},
		score: {
			leftPlayer: 0,
			rightPlayer: 0
		}
	};
	public watchers: OnlineUser[] = [];

	constructor(
		public leftPlayer: Gamer,
		public rightPlayer: Gamer,
		// usersService: UsersService
	) {
		this.sendMsg('gameSettings', JSON.stringify(this.gameSettings));
		this.leftPlayer.gamePoints = 0;
		this.rightPlayer.gamePoints = 0;
		this.resetPositions(true);
	}

	resetPositions(withPlatforms = false) {
		if (withPlatforms) {
			this.coordinates.leftPlayer.y = Math.round((this.gameSettings.canvasHeight - this.gameSettings.playerHeight) / 2);
			this.coordinates.rightPlayer.y = Math.round((this.gameSettings.canvasHeight - this.gameSettings.playerHeight) / 2);
		}
		this.coordinates.ball.x = Math.round((this.gameSettings.canvasWidth - this.gameSettings.ballSize) / 2);
		this.coordinates.ball.y = Math.round(Math.random() * (this.gameSettings.canvasHeight - this.gameSettings.ballSize));
		this.gameSettings.ballAngle = (Math.random() * Math.PI / 2) - Math.PI / 4;
		if (Math.random() < 0.5)
			this.gameSettings.ballAngle += Math.PI;
	}

	public sendMsg(event: string, data: string) {
		// // TODO работает на каждом рендере, так себе решение
		// this.watchers = this.watchers.filter(watcher => this.usersService.usersSocketIds.get(watcher.socket.id));

		this.leftPlayer.user.socket.emit(event, data);
		this.rightPlayer.user.socket.emit(event, data);
		for (let i = 0; i < this.watchers.length; ++i)
			this.watchers[i].socket.emit(event, data);
	}

	updatePositions() {
		// Score
		if (this.coordinates.ball.x < 0 - this.gameSettings.ballSize) {
			++this.gameSettings.score.rightPlayer;
			this.sendMsg('gameScore', JSON.stringify(this.gameSettings.score));
			this.resetPositions();
			this.sendMsg('playSound', 'pong-sound-3');
		}
		if (this.coordinates.ball.x > this.gameSettings.canvasWidth) {
			++this.gameSettings.score.leftPlayer;
			this.sendMsg('gameScore', JSON.stringify(this.gameSettings.score));
			this.resetPositions();
			this.sendMsg('playSound', 'pong-sound-3');
		}

		// PlayerOne moving
		if (this.leftPlayer.controls.arrowUp && this.coordinates.leftPlayer.y >= this.gameSettings.playerStep)
			this.coordinates.leftPlayer.y -= this.gameSettings.playerStep;
		if (this.leftPlayer.controls.arrowDown && this.coordinates.leftPlayer.y < this.gameSettings.canvasHeight - this.gameSettings.playerHeight)
			this.coordinates.leftPlayer.y += this.gameSettings.playerStep;

		// PlayerTwo moving
		if (this.rightPlayer.controls.arrowUp && this.coordinates.rightPlayer.y >= this.gameSettings.playerStep)
			this.coordinates.rightPlayer.y -= this.gameSettings.playerStep;
		if (this.rightPlayer.controls.arrowDown && this.coordinates.rightPlayer.y < this.gameSettings.canvasHeight - this.gameSettings.playerHeight)
			this.coordinates.rightPlayer.y += this.gameSettings.playerStep;

		// Ball bouncing (walls)
		const bounceOffTheNorthWall = this.coordinates.ball.y + this.gameSettings.ballSize >= this.gameSettings.canvasHeight;
		const bounceOffTheSouthWall = this.coordinates.ball.y <= 0;
		if ((bounceOffTheNorthWall && Math.sin(this.gameSettings.ballAngle) > 0) ||
			(bounceOffTheSouthWall && Math.sin(this.gameSettings.ballAngle) < 0)) {
			this.gameSettings.ballAngle = -this.gameSettings.ballAngle;
			this.sendMsg('playSound', 'pong-sound-1');
		}

		// Ball collision with platforms
		const bounceOffTheLeftPlayer = this.coordinates.ball.x <= this.gameSettings.playerMargin + this.gameSettings.playerWidth &&
			this.coordinates.ball.y + this.gameSettings.ballSize >= this.coordinates.leftPlayer.y &&
			this.coordinates.ball.y < this.coordinates.leftPlayer.y + this.gameSettings.playerHeight;
		const bounceOffTheRightPlayer = this.coordinates.ball.x >= this.gameSettings.canvasWidth - this.gameSettings.playerMargin - this.gameSettings.playerWidth - this.gameSettings.ballSize &&
			this.coordinates.ball.y + this.gameSettings.ballSize >= this.coordinates.rightPlayer.y &&
			this.coordinates.ball.y < this.coordinates.rightPlayer.y + this.gameSettings.playerHeight;
		if (bounceOffTheLeftPlayer || bounceOffTheRightPlayer) {
			let k;
			if (bounceOffTheLeftPlayer)
				k = (this.coordinates.ball.y + this.gameSettings.ballSize / 2 - this.coordinates.leftPlayer.y) / this.gameSettings.playerHeight;
			else
				k = (this.coordinates.ball.y + this.gameSettings.ballSize / 2 - this.coordinates.rightPlayer.y) / this.gameSettings.playerHeight;
			if (k < 1 / 8)
				this.gameSettings.ballAngle = -Math.PI / 4;
			else if (k >= 1 / 8 && k < 2 / 8)
				this.gameSettings.ballAngle = -Math.PI / 6;
			else if (k >= 2 / 8 && k < 3 / 8)
				this.gameSettings.ballAngle = -Math.PI / 12;
			else if (k >= 3 / 8 && k < 5 / 8)
				this.gameSettings.ballAngle = 0;
			else if (k >= 5 / 8 && k < 6 / 8)
				this.gameSettings.ballAngle = Math.PI / 12;
			else if (k >= 6 / 8 && k < 7 / 8)
				this.gameSettings.ballAngle = Math.PI / 6;
			else if (k >= 7 / 8)
				this.gameSettings.ballAngle = Math.PI / 4;
			if (bounceOffTheRightPlayer)
				this.gameSettings.ballAngle = Math.PI - this.gameSettings.ballAngle;
			this.sendMsg('playSound', 'pong-sound-2');
		}

		// Ball moving
		this.coordinates.ball.x += Math.cos(this.gameSettings.ballAngle) * this.gameSettings.ballSpeed;
		this.coordinates.ball.y += Math.sin(this.gameSettings.ballAngle) * this.gameSettings.ballSpeed;

		this.coordinates.ball.x = Math.round(this.coordinates.ball.x);
		this.coordinates.ball.y = Math.round(this.coordinates.ball.y);
		this.coordinates.leftPlayer.y = Math.round(this.coordinates.leftPlayer.y);
		this.coordinates.rightPlayer.y = Math.round(this.coordinates.rightPlayer.y);
	}
}

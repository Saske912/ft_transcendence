import { BallType, getBallColor, getBallType, getEnemyColor, getUserColor } from "components/GameSettings";
import { useAppSelector } from 'hook/reduxHooks';
import { ApiGameLoop, ApiGameSettings } from 'models/ApiTypes';
import GameBall from 'models/GameBall';
import Player from 'models/Player';
import GameResults from 'pages/Game/GameResults';
import React, { useCallback, useEffect, useMemo } from "react";
import { Fade } from 'react-awesome-reveal';
import { Link } from 'react-router-dom';

interface GameCanvasProps {
	watchMode: boolean;
	gameSettings: ApiGameSettings;
}

const GameCanvas = ({ watchMode, gameSettings }: GameCanvasProps) => {
	const { socket } = useAppSelector((state) => state.socket);
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const leftPlayer = useMemo(() => new Player(), []);
	const rightPlayer = useMemo(() => new Player(), []);
	const ball = useMemo(() => new GameBall(), []);
	const { currentUser } = useAppSelector((state) => state.currentUser);

	const userColor = useMemo(() => getUserColor(), []);
	const enemyColor = useMemo(() => getEnemyColor(), []);
	const ballColor = useMemo(() => getBallColor(), []);
	const ballType = useMemo(() => getBallType(), []);

	const score = useMemo(
		() => ({
			leftPlayer: gameSettings.score.leftPlayer,
			rightPlayer: gameSettings.score.rightPlayer,
		}),
		[gameSettings.score.leftPlayer, gameSettings.score.rightPlayer],
	);

	const [gameResults, setGameResults] = React.useState<{ winner: string } | null>(null);

	const pongSound1 = useMemo(() => {
		const audio = new Audio('/audio/pong-sound-1.wav');
		audio.volume = 0.17;

		return audio;
	}, []);
	const pongSound2 = useMemo(() => {
		const audio = new Audio('/audio/pong-sound-2.wav');
		audio.volume = 0.17;

		return audio;
	}, []);
	const pongSound3 = useMemo(() => {
		const audio = new Audio('/audio/pong-sound-3.wav');
		audio.volume = 0.1;

		return audio;
	}, []);

	const gameLoopHandler = useCallback((e: string) => {
		const data: ApiGameLoop = JSON.parse(e);

		if (data.b) {
			ball.xPosition = data.b.x;
			ball.yPosition = data.b.y;
		}

		if (data.lP) leftPlayer.yPosition = data.lP.y;

		if (data.rP) rightPlayer.yPosition = data.rP.y;
	}, [ball, leftPlayer, rightPlayer]);

	const gameResultsHandler = useCallback((e: string) => {
		const data: { winner: string } = JSON.parse(e);
		setGameResults(data);
	}, []);

	const gameScoreHandler = useCallback((e: string) => {
		const data = JSON.parse(e);
		score.leftPlayer = data.leftPlayer;
		score.rightPlayer = data.rightPlayer;
	}, [score]);

	const playSoundHandler = useCallback((e: string) => {
		if (e === 'pong-sound-1') {
			pongSound1.play()
				.catch(() => {});
		} else if (e === 'pong-sound-2') {
			pongSound2.play()
				.catch(() => {});
		} else if (e === 'pong-sound-3') {
			pongSound3.play()
				.catch(() => {});
		}
	}, [pongSound1, pongSound2, pongSound3]);

	// Socket events
	useEffect(() => {
		socket.on('gameResults', gameResultsHandler);
		socket.on('gameLoop', gameLoopHandler);
		socket.on('gameScore', gameScoreHandler);
		socket.on('playSound', playSoundHandler);

		return () => {
			socket.off('gameResults', gameResultsHandler);
			socket.off('gameLoop', gameLoopHandler);
			socket.off('gameScore', gameScoreHandler);
			socket.off('playSound', playSoundHandler);
		};
	}, [
		ball,
		gameLoopHandler,
		gameResultsHandler,
		gameScoreHandler,
		leftPlayer,
		playSoundHandler,
		rightPlayer,
		score,
		socket,
	]);

	const { playerWidth, playerMargin, playerHeight } = gameSettings;

	// keydown, keyup handlers
	useEffect(() => {
		if (watchMode) return;

		const keyDownHandler = (e: KeyboardEvent) => {
			let currentPlayer;

			if (currentUser.username === leftPlayer.username) currentPlayer = leftPlayer;
			else if (currentUser.username === rightPlayer.username) currentPlayer = rightPlayer;
			else return;

			if (['ArrowDown', 'ArrowUp'].indexOf(e.key) !== -1) {
				if (e.key === 'ArrowDown' && currentPlayer.controls.arrowDown) return;

				if (e.key === 'ArrowUp' && currentPlayer.controls.arrowUp) return;
				const data = {
					login: currentUser.username,
					gameId: gameSettings.id,
					key: e.key,
				};
				socket.emit('keyDown', JSON.stringify(data));

				if (e.key === 'ArrowDown') currentPlayer.controls.arrowDown = true;
				else if (e.key === 'ArrowUp') currentPlayer.controls.arrowUp = true;
			}
		};

		const keyUpHandler = (e: KeyboardEvent) => {
			let currentPlayer;

			if (currentUser.username === leftPlayer.username) currentPlayer = leftPlayer;
			else if (currentUser.username === rightPlayer.username) currentPlayer = rightPlayer;
			else return;

			if (['ArrowDown', 'ArrowUp'].indexOf(e.key) !== -1) {
				const data = {
					login: currentUser.username,
					gameId: gameSettings.id,
					key: e.key,
				};
				socket.emit('keyUp', JSON.stringify(data));

				if (e.key === 'ArrowDown') currentPlayer.controls.arrowDown = false;
				else if (e.key === 'ArrowUp') currentPlayer.controls.arrowUp = false;
			}
		};

		document.addEventListener('keydown', keyDownHandler);
		document.addEventListener('keyup', keyUpHandler);

		return () => {
			document.removeEventListener('keydown', keyDownHandler);
			document.removeEventListener('keyup', keyUpHandler);
		};
	}, [currentUser.username, gameSettings, leftPlayer, rightPlayer, socket, watchMode]);

	// Game loop
	useEffect(() => {
		let gameRuns = true;

		const drawBackground = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
			ctx.beginPath();
			ctx.fillStyle = '#111';
			ctx.rect(0, 0, canvas.width, canvas.height);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.fillStyle = '#ccc';
			const dividerCount = 25;
			const dividerWidth = 5;
			const dividerSpace = 15;
			const dividerHeight = (canvas.height - dividerSpace * (dividerCount - 1)) / dividerCount;
			for (let i = 0; i < canvas.height; i += dividerHeight + 15)
				ctx.rect((canvas.width - dividerWidth) / 2, i, dividerWidth, dividerHeight);
			ctx.fill();
			ctx.closePath();
		};

		const drawLeftRectangle = (_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
			ctx.rect(playerMargin, leftPlayer.yPosition, playerWidth, playerHeight);
			ctx.fill();
		};

		const putScore = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
			ctx.beginPath();
			ctx.fillStyle = '#fff';
			ctx.font = "42px 'Press Start 2P', cursive";
			ctx.textAlign = 'right';
			ctx.fillText(`${score.leftPlayer}`, canvas.width / 2 - 50, 70, 100);
			ctx.textAlign = 'left';
			ctx.fillText(`${score.rightPlayer}`, canvas.width / 2 + 50, 70, 100);
			ctx.closePath();
		};

		const drawRightRectangle = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
			ctx.rect(canvas.width - playerWidth - playerMargin, rightPlayer.yPosition, playerWidth, playerHeight);
			ctx.fill();
		};

		const drawBall = (_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
			if (ballType === BallType.Square) {
				ctx.rect(ball.xPosition, ball.yPosition, ball.size, ball.size);
				ctx.fill();
			} else if (ballType === BallType.Circle) {
				ctx.arc(ball.xPosition + ball.size / 2, ball.yPosition + ball.size / 2, ball.size / 2, 0, Math.PI * 2);
				ctx.fill();
			}
		};

		const render = () => {
			const canvas = canvasRef.current;

			if (!canvas) {
				// console.log('[render] cannot get canvas');

				return;
			}
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				// console.log('[render] cannot get ctx');

				return;
			}

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			drawBackground(canvas, ctx);
			putScore(canvas, ctx);

			if (leftPlayer.username === currentUser.username) {
				ctx.beginPath();
				ctx.fillStyle = userColor;
				drawLeftRectangle(canvas, ctx);
				ctx.closePath();
				ctx.beginPath();
				ctx.fillStyle = enemyColor;
				drawRightRectangle(canvas, ctx);
				ctx.closePath();
			} else {
				ctx.beginPath();
				ctx.fillStyle = enemyColor;
				drawLeftRectangle(canvas, ctx);
				ctx.closePath();
				ctx.beginPath();
				ctx.fillStyle = userColor;
				drawRightRectangle(canvas, ctx);
				ctx.closePath();
			}

			ctx.beginPath();
			ctx.fillStyle = ballColor;
			drawBall(canvas, ctx);
			ctx.closePath();
		};

		const runGame = () => {
			// console.log('!!! [runGame] !!!');
			let fpsInterval: number;
			let now: number;
			let then: number;
			let elapsed: number;
			const fps = 60;

			const animate = () => {
				if (!gameRuns) return;

				requestAnimationFrame(animate);
				now = Date.now();
				elapsed = now - then;

				if (elapsed > fpsInterval) {
					then = now - (elapsed % fpsInterval);
					render();
				}
			};

			fpsInterval = 1000 / fps;
			then = Date.now();
			animate();
		};

		const prepareGame = () => {
			const canvas = canvasRef.current;

			if (!canvas) return;

			ball.angle = 0;
			ball.speed = gameSettings.ballSpeed;
			ball.size = gameSettings.ballSize;
			ball.xPosition = -ball.size;
			ball.yPosition = 0;
			leftPlayer.yPosition = Math.round((canvas.height - playerHeight) / 2);
			rightPlayer.yPosition = Math.round((canvas.height - playerHeight) / 2);
			leftPlayer.username = gameSettings.leftPlayer.login;
			rightPlayer.username = gameSettings.rightPlayer.login;

			render();
		};

		prepareGame();

		runGame();

		return () => {
			gameRuns = false;
		};
	}, [
		ball,
		currentUser.username,
		gameSettings,
		leftPlayer,
		playerHeight,
		playerMargin,
		playerWidth,
		rightPlayer,
		score.leftPlayer,
		score.rightPlayer,
		ballColor,
		ballType,
		enemyColor,
		userColor,
	]);

	return (
		<div className="game-container">
			<div className="info-board">
				<Link to={`/users/${gameSettings.leftPlayer.login}`} className="info-board-user info-board-left-user">
					<div
						className="info-board-user-img"
						style={{ backgroundImage: `url(${gameSettings.leftPlayer.url_avatar})` }}
					/>
					<div className="info-board-user-name">{gameSettings.leftPlayer.login}</div>
				</Link>
				<Link to={`/users/${gameSettings.rightPlayer.login}`} className="info-board-user info-board-right-user">
					<div className="info-board-user-name">{gameSettings.rightPlayer.login}</div>
					<div
						className="info-board-user-img"
						style={{ backgroundImage: `url(${gameSettings.rightPlayer.url_avatar})` }}
					/>
				</Link>
			</div>
			<canvas id="game-canvas" width="1024px" height="600px" ref={canvasRef} />
			{gameResults && (
				<Fade className="game-results-wrapper" duration={500}>
					<GameResults
						winner={gameResults.winner}
						loser={
							gameResults.winner === gameSettings.leftPlayer.login
								? gameSettings.rightPlayer.login
								: gameSettings.leftPlayer.login
						}
					/>
				</Fade>
			)}
		</div>
	);
};

export default GameCanvas;

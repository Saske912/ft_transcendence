import {GameTime} from "components/GameTime";
import {ApiGame, ApiUser} from "models/ApiTypes";
import {Link} from "react-router-dom";

interface GameItemProps {
	game: ApiGame;
	enemy?: ApiUser;
	user?: ApiUser;
}

export const GameItem = ({ enemy, game, user }: GameItemProps) => {
	// const statusColor = enemy ? enemy.status : 'transparent';
	// const statusColor = 'pink';

	return (
		<div className="games-history-game">
			<div className="games-history-enemy">
				<div style={{ backgroundImage: `url(${enemy?.url_avatar})` }} className="games-history-game-img">
					{/* <div className='games-history-user-status' style={ { backgroundColor: statusColor } }/>*/}
				</div>
				<Link to={`/users/${enemy?.login}`} className="games-history-user-login">
					{enemy?.login}
				</Link>
			</div>
			{game.winnerId === user?.id ? (
				<div className="games-history-win">Win</div>
			) : (
				<div className="games-history-lose">Lose</div>
			)}
			<div className="games-history-game-score">{`${game.leftScore} : ${game.rightScore}`}</div>
			<div className="games-history-game-date">
				<GameTime date={game.date} />
			</div>
		</div>
	);
};

export default GameItem;

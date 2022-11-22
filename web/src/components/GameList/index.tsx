import {faGamepad} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import GameItem from "components/GameItem";
import {useAppSelector} from "hook/reduxHooks";
import { ApiGame } from "models/ApiTypes";
import { useParams } from "react-router-dom";
import {getTargetUser} from "utils/getTargetUser";

interface GameListProps {
	gamesHistory: ApiGame[];
}

export const GameList = ({ gamesHistory }: GameListProps) => {
	const { allUsers } = useAppSelector((state) => state.allUsers);
	const params = useParams<{ login: string }>();

	if (gamesHistory.length === 0) {
		return (
			<div className="list-section-empty">
				No games yet
				<FontAwesomeIcon icon={faGamepad} />
			</div>
		);
	}

	return (
		<>
			{gamesHistory.slice(0, 3).map((game, i) => {
				const loser = getTargetUser(allUsers, game.loserId, 'id'); // allUsers.find((usr) => usr.id === game.loserId);
				const winner = getTargetUser(allUsers, game.winnerId, 'id'); // allUsers.find((usr) => usr.id === game.winnerId);

				return (
					<GameItem
						/* eslint-disable-next-line react/no-array-index-key */
						key={i}
						game={game}
						user={winner?.login === params.login ? winner : loser}
						enemy={loser?.login === params.login ? winner : loser}
					/>
				);
			})}
		</>
	);
};

export default GameList;

import { faArrowRight, faGamepad } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppSelector } from "hook/reduxHooks";
import { Link } from "react-router-dom";

const EmptyGameHistory = () => {
	const { currentUser } = useAppSelector((state) => state.currentUser);

	return (
		<div className="main-block recent-games">
			<div className="main-block-title">
				<span>Recent games</span>
				<Link className="recent-games-link" to={`/games/${currentUser.username}`}>
					<FontAwesomeIcon icon={faArrowRight} />
				</Link>
			</div>
			<div className="recent-games-empty">
				You have no games yet
				<FontAwesomeIcon icon={faGamepad} />
			</div>
		</div>
	);
};

export default EmptyGameHistory;

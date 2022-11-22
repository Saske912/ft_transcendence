import { ApiUserExpand } from "models/ApiTypes";
import { Link } from "react-router-dom";

export const SocialBlockFriend = ({ user }: { user: ApiUserExpand }) => {
	const statusDescription = 'Offline';
	const statusColor = 'transparent';

	return (
		<li className="social-block-user">
			<div className="social-block-user-img" style={{ backgroundImage: `url(${user.url_avatar})` }}>
				<div className="user-status" style={{ backgroundColor: statusColor }} />
			</div>
			<Link to={`/users/${user.login}`} className="social-block-user-username">
				{user.login}
			</Link>
			<div className="social-block-user-status-description">{statusDescription}</div>
		</li>
	);
};

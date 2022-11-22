import './styles.scss';

import { ApiUser } from "models/ApiTypes";

interface LeftMenuChatProps {
	companion: ApiUser;
	isSelected: boolean;
	selectChat: () => void;
}

const Chat = ({ companion, isSelected, selectChat }: LeftMenuChatProps) => {
	return (
		<div className={`messenger-contact ${isSelected ? 'messenger-contact-selected' : ''}`} onMouseDown={selectChat}>
			<div className="messenger-contact-image" style={{ backgroundImage: `url(${companion.url_avatar})` }} />
			<div className="messenger-contact-name">{companion.login}</div>
		</div>
	);
};

export default Chat;

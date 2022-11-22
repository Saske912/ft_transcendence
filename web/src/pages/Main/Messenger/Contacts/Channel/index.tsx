import './styles.scss';

import { faBullhorn, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface LeftMenuChannelProps {
	isSelected: boolean;
	title: string;
	selectChannel: () => void;
	isPrivate: boolean;
}

const Channel = ({ isSelected, title, selectChannel, isPrivate }: LeftMenuChannelProps) => {
	return (
		<div
			className={`messenger-channel ${isSelected ? 'messenger-channel-selected' : ''}`}
			onMouseDown={selectChannel}
		>
			<div className="messenger-channel-image">
				<FontAwesomeIcon icon={faBullhorn} />
				{isPrivate && <FontAwesomeIcon className="messenger-channel-image-private" icon={faLock} />}
			</div>
			<div className="messenger-channel-name">{title}</div>
		</div>
	);
};

export default Channel;

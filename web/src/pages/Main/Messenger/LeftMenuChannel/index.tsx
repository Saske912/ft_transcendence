import './styles.scss';

import { faBullhorn, faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

interface LeftMenuChannelProps {
	isSelected: boolean,
	title: string,
	selectChannel: () => void,
	isPrivate: boolean
}

const LeftMenuChannel = ({ isSelected, title, selectChannel, isPrivate }: LeftMenuChannelProps) => {
	return (
		<div className={ `messenger-channel ${isSelected ? 'messenger-channel-selected' : ''}` } onMouseDown={ selectChannel }>
			<div className='messenger-channel-image'>
				<FontAwesomeIcon icon={ faBullhorn }/>
			</div>
			<div className='messenger-channel-name'>
				{ title }
				{ isPrivate && <FontAwesomeIcon icon={ faLock }/> }
			</div>
		</div>
	);
};

export default LeftMenuChannel;
import './styles.scss';

import { faBell } from "@fortawesome/free-solid-svg-icons/faBell";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UserStatus } from "models/apiTypes";
import { User } from "models/User";
import React from 'react';

interface HeaderProps {
	currentUser: User,
	status: UserStatus,
	centerBlock?: JSX.Element
}

const Header = ({ currentUser, status, centerBlock }: HeaderProps) => {
	return (
		<header>
			<div className='header-container'>
				<h1 style={{ letterSpacing: '2px' }}>
					FT
				</h1>

				{centerBlock && centerBlock}

				<div className='header-buttons'>
					<button className='notifications-btn'>
						<FontAwesomeIcon icon={faBell}/>
					</button>
					<button
						style={{ backgroundImage: `url(${currentUser.urlAvatar})` }}
						className='user-btn'
					>
						<div className='user-status' style={{ backgroundColor: status }}/>
					</button>
				</div>
			</div>
		</header>
	);
};

export default Header;

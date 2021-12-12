import './styles.scss';

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from 'app/hooks';
import UserMenu from 'components/Header/UserMenu';
import React from 'react';
import { Link, useHistory } from 'react-router-dom';

interface HeaderProps {
	centerBlock?: JSX.Element;
}

const Header = ({ centerBlock }: HeaderProps) => {
	const history = useHistory();
	const [userMenuShown, setUserMenuShown] = React.useState(false);
	const { currentUser } = useAppSelector((state) => state.currentUser);
	const { status } = useAppSelector((state) => state.status);

	if (history.location.pathname !== '/')
		return (
			<header>
				<div className="header-container">
					<button onClick={() => history.goBack()} className="header-back-btn">
						<FontAwesomeIcon icon={faChevronLeft} />
					</button>

					{centerBlock || (
						<Link to="/">
							<h1 style={{ letterSpacing: '2px' }}>FT</h1>
						</Link>
					)}

					<div className="header-buttons">
						<button className="notifications-btn">
							<FontAwesomeIcon icon={faBell} />
						</button>
						{/* eslint-disable-next-line jsx-a11y/mouse-events-have-key-events */}
						<button
							className="user-btn"
							onClick={() => setUserMenuShown((prev) => !prev)}
							onMouseOver={() => setUserMenuShown(true)}
							onMouseLeave={() => setUserMenuShown(false)}
						>
							<div
								className="user-btn-img"
								style={{ backgroundImage: `url(${currentUser.urlAvatar})` }}
							/>
							<div className="user-status" style={{ backgroundColor: status }} />
							{userMenuShown && <UserMenu />}
						</button>
					</div>
				</div>
			</header>
		);

	return (
		<header>
			<div className="header-container">
				<Link to="/">
					<h1 style={{ letterSpacing: '2px' }}>FT</h1>
				</Link>

				{centerBlock || null}

				<div className="header-buttons">
					<button className="notifications-btn">
						<FontAwesomeIcon icon={faBell} />
					</button>
					{/* eslint-disable-next-line jsx-a11y/mouse-events-have-key-events */}
					<button
						className="user-btn"
						onMouseOver={() => setUserMenuShown(true)}
						onMouseLeave={() => setUserMenuShown(false)}
					>
						<div className="user-btn-img" style={{ backgroundImage: `url(${currentUser.urlAvatar})` }} />
						<div className="user-status" style={{ backgroundColor: status }} />
						{userMenuShown && <UserMenu />}
					</button>
				</div>
			</div>
		</header>
	);
};

export default Header;

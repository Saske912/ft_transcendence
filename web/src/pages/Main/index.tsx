import './styles.scss';

import { useAppSelector } from 'app/hooks';
import Header from 'components/Header';
import FindGame from 'pages/Main/FindGame';
import Messenger from 'pages/Main/Messenger';
import RecentGames from 'pages/Main/RecentGames';
import Social from 'pages/Main/Social';
import React from 'react';
import { Fade } from 'react-awesome-reveal';
import { useHistory } from 'react-router-dom';
import { ApiUserStatus } from 'models/ApiTypes';

interface MainProps {
	enemyIsReady: boolean;
}

const Main: React.FC<MainProps> = ({ enemyIsReady }) => {
	const history = useHistory();
	const { status } = useAppSelector((state) => state.status);

	// Redirect to /game
	React.useEffect(() => {
		if (status === ApiUserStatus.InGame) history.push('/game');
	});

	return (
		<div className="main">
			<div className="main-container">
				<Header />
				<div className="main-top">
					<div className="main-center">
						<Fade triggerOnce style={{ position: 'relative', zIndex: 9 }}>
							<FindGame enemyIsReady={enemyIsReady} />
						</Fade>
						<Fade delay={100} triggerOnce style={{ position: 'relative', zIndex: 8 }}>
							<RecentGames />
						</Fade>
					</div>
					<div className="main-right">
						<Fade delay={100} triggerOnce className="main-block social">
							<Social />
						</Fade>
					</div>
				</div>
				<Fade delay={400} triggerOnce>
					<Messenger />
				</Fade>
			</div>
		</div>
	);
};

export default Main;

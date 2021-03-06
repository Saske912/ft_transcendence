import './styles.scss';

import { useAppDispatch, useAppSelector } from 'hook/reduxHooks';
import { ApiUserStatus } from 'models/ApiTypes';
import GameCanvas from 'pages/Game/GameCanvas';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { setStatus } from 'store/reducers/statusSlice';

const Game = () => {
	const history = useHistory();
	const { status } = useAppSelector((state) => state.status);
	const { enemy } = useAppSelector((state) => state.enemy);
	const { settings } = useAppSelector((state) => state.game);
	const dispatch = useAppDispatch();

	const watchMode = status !== ApiUserStatus.InGame;

	React.useEffect(() => {
		if (watchMode) return;

		if (!enemy) {
			dispatch(setStatus(ApiUserStatus.Regular));
			history.push('/');
		}
	}, [history, enemy, watchMode, dispatch]);

	return (
		<div>
			{settings && <GameCanvas watchMode={watchMode} gameSettings={settings}/>}
		</div>
	);
};

export default Game;

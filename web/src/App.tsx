import React from 'react';
import './App.scss';

import { useAppDispatch, useAppSelector } from 'app/hooks';
import { setAllUsers } from 'app/reducers/allUsersSlice';
import { setCurrentUser } from 'app/reducers/currentUserSlice';
import { setEnemy } from 'app/reducers/enemySlice';
import { setOnlineUsers } from 'app/reducers/onlineUsersSlice';
import { setStatus } from 'app/reducers/statusSlice';
import { getToken, removeToken, setToken } from 'app/token';
import axios from 'axios';
import { SocketContext } from 'context/socket';
import { ApiGameSettings, ApiUpdateUser, ApiUser, ApiUserExpand, ApiUserStatus } from 'models/ApiTypes';
import { User } from 'models/User';
import Game from 'pages/Game';
import GamesHistory from 'pages/GamesHistory';
import Login from 'pages/Login';
import Main from 'pages/Main';
import Register from 'pages/Register';
import UserProfile from 'pages/UserProfile';
import { useMediaQuery } from 'react-responsive';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';

export const getCurrentUser = async (accessToken: string, socketId: string, strategy: string): Promise<User | null> => {
	if (strategy === 'local') {
		try {
			const usr = await axios
				.get<ApiUser | null>('/auth', {
					params: { socketId },

					headers: { Authorization: `Bearer ${accessToken}` },
				})
				.then((res) => res.data);

			if (usr) {
				const user = new User();
				user.id = usr.id;
				user.username = usr.login;
				user.urlAvatar = usr.url_avatar;

				return user;
			}

			return null;
		} catch {
			return null;
		}
	}

	if (strategy === 'intra') {
		try {
			const r = await axios
				.post<any, any>('/auth/intra', {
					code: accessToken,
				})
				.then((res) => res.data);
			setToken(r.access_token);

			return await getCurrentUser(r.access_token, socketId, 'local');
		} catch {
			return null;
		}
	}

	return null;
};

const fetchAllUsers = () => {
	return axios
		.get<ApiUserExpand[]>('/users', {
			params: { expand: '' },
			headers: { Authorization: `Bearer ${getToken()}` },
		})
		.then((res) => res.data);
};

const App = () => {
	const isDesktop = useMediaQuery({ query: '(min-width: 1024px)' });

	const history = useHistory();
	const socket = React.useContext(SocketContext);
	const gameSettingsRef = React.useRef<ApiGameSettings | null>(null);
	const gameRef = React.useRef<{ runs: boolean; interval: null | NodeJS.Timeout }>({ runs: false, interval: null });
	const onlineUsersRef = React.useRef<ApiUpdateUser[]>([]);
	const [socketId, setSocketId] = React.useState<string | null>(null);
	const [enemyIsReady, setEnemyIsReady] = React.useState<boolean>(false);
	const sockId = socketId || socket.id;

	const { currentUser } = useAppSelector((state) => state.currentUser);
	const { onlineUsers } = useAppSelector((state) => state.onlineUsers);
	const { status } = useAppSelector((state) => state.status);
	const { enemy } = useAppSelector((state) => state.enemy);
	const dispatch = useAppDispatch();

	// Saving onlineUsers in onlineUsersRef
	React.useEffect(() => {
		onlineUsersRef.current = onlineUsers;
	}, [onlineUsers, onlineUsersRef]);

	// Fetching onlineUsers
	React.useEffect(() => {
		let isMounted = true;

		if (!currentUser.isAuthorized()) return;

		axios
			.get<ApiUpdateUser[]>('/users/online', {
				headers: { Authorization: `Bearer ${getToken()}` },
			})
			.then((res) => {
				if (!isMounted) return;
				dispatch(setOnlineUsers(res.data));
			});

		return () => {
			isMounted = false;
		};
	}, [currentUser, dispatch]);

	// Fetching allUsers + updating on onlineUsers change
	React.useEffect(() => {
		let isMounted = true;

		if (!currentUser.isAuthorized()) return;

		fetchAllUsers().then((users) => {
			if (!isMounted) return;
			dispatch(setAllUsers(users));
		});

		return () => {
			isMounted = false;
		};
	}, [currentUser, dispatch, onlineUsers]);

	// Getting user from access_token
	React.useEffect(() => {
		const accessToken = getToken();
		const sockId = socketId || socket.id;

		if (accessToken && sockId) {
			getCurrentUser(accessToken, sockId, 'local').then((usr) => {
				if (usr) {
					dispatch(setCurrentUser(usr));
				} else {
					removeToken();
					dispatch(setCurrentUser(new User()));
				}
			});
		}
	}, [dispatch, socket.id, socketId]);

	// Saving socketId in state
	React.useEffect(() => {
		const connectHandler = () => {
			setSocketId(socket.id);
		};

		const disconnectHandler = (reason: string) => {
			setSocketId(null);

			if (reason === 'io server disconnect') socket.connect();
		};

		// todo [можно придумать что-то получше]
		const sockInterval = setInterval(() => {
			if (sockId) {
				clearInterval(sockInterval);
			}

			if (socket.id) {
				setSocketId(socket.id);
				clearInterval(sockInterval);
			}
		}, 100);

		socket.on('connect', connectHandler);
		socket.on('disconnect', disconnectHandler);

		return () => {
			socket.off('connect', connectHandler);
			socket.off('disconnect', disconnectHandler);
		};
	}, [sockId, socket]);

	// Redirect to /login
	React.useEffect(() => {
		if (history.location.pathname !== '/login' && history.location.pathname !== '/register' && !getToken()) {
			history.push('/login');
		}
	}, [currentUser, history]);

	// Event handlers
	React.useEffect(() => {
		if (!currentUser.isAuthorized()) return;

		const logoutHandler = (data: string) => {
			const logoutData: ApiUpdateUser = JSON.parse(data);
			dispatch(setOnlineUsers(onlineUsersRef.current.filter((usr) => usr.login !== logoutData.login)));
		};

		const gameSettingsHandler = (e: string) => {
			const gameSettings: ApiGameSettings = JSON.parse(e);
			gameSettingsRef.current = gameSettings;

			// If watch mode is on, don't send start
			if (
				gameSettings.leftPlayer.login !== currentUser.username &&
				gameSettings.rightPlayer.login !== currentUser.username
			)
				return;

			const data = {
				login: currentUser.username,
				id: gameSettings.id,
			};
			setTimeout(() => socket.emit('start', JSON.stringify(data)), 3000);
		};

		const updateUserHandler = (data: string) => {
			const updateUserData: ApiUpdateUser[] = JSON.parse(data);

			dispatch(setOnlineUsers(updateUserData));

			// Update currentUser
			const currUsr = updateUserData.find((usr) => usr.id === currentUser.id);

			if (currUsr) {
				currentUser.username = currUsr.login;
				currentUser.urlAvatar = currUsr.url_avatar;
				dispatch(setCurrentUser(currentUser));
			}

			if (enemy) {
				const enemyData = updateUserData.find((usr) => usr.id === enemy.id);

				if (!enemyData) return;
				const enemyDeclinedGame =
					enemyData.status === ApiUserStatus.Declined || enemyData.status === ApiUserStatus.Regular;
				const enemyAcceptedGame = enemyData.status === ApiUserStatus.Accepted;

				if (enemyDeclinedGame) {
					dispatch(setStatus(ApiUserStatus.Regular));
					setEnemyIsReady(false);
				} else if (enemyAcceptedGame) {
					setEnemyIsReady(true);
				}
			}
		};

		const enemyHandler = (e: string) => {
			const enemyData: ApiUpdateUser | null = JSON.parse(e);
			dispatch(setEnemy(enemyData));
			dispatch(setStatus(ApiUserStatus.FoundEnemy));
		};

		const gameIsReadyHandler = () => {
			dispatch(setStatus(ApiUserStatus.InGame));
		};

		socket.on('logout', logoutHandler);
		socket.on('updateUser', updateUserHandler);
		socket.on('enemy', enemyHandler);
		socket.on('gameIsReady', gameIsReadyHandler);
		socket.on('gameSettings', gameSettingsHandler);

		return () => {
			socket.off('logout', logoutHandler);
			socket.off('updateUser', updateUserHandler);
			socket.off('enemy', enemyHandler);
			socket.off('gameIsReady', gameIsReadyHandler);
			socket.off('gameSettings', gameSettingsHandler);
		};
	}, [currentUser, socket, gameSettingsRef, onlineUsersRef, onlineUsers, dispatch, status, enemy]);

	if (!isDesktop) return <div style={{ fontSize: '2em', marginTop: '100px' }}>Window is too small :(</div>;

	return (
		<Switch>

			<Route exact path='/login'>
				{ currentUser.isAuthorized() ? <Redirect to='/'/> : <Login socketId={ sockId }/> }
			</Route>

			<Route exact path='/register'>
				{ currentUser.isAuthorized() ? <Redirect to='/'/> : <Register/> }
			</Route>

			<Route exact path='/game'>
				{
					currentUser.isAuthorized()
						?	<Game
								enemyInfo={ enemy }
								gameSettingsRef={ gameSettingsRef }
								gameRef={ gameRef }
							/>
						:	<FullPageLoader/>
				}
			</Route>

			<Route path='/games/:login'>
				{
					currentUser.isAuthorized()
						?	<GamesHistory/>
						:	<FullPageLoader/>
				}
			</Route>

			<Route path='/users/:login'>
				{
					currentUser.isAuthorized()
						?	<UserProfile/>
						:	<FullPageLoader/>
				}
			</Route>

			<Route exact path='/'>
				{
					currentUser.isAuthorized()
						?	<Main enemyIsReady={ enemyIsReady } />
						:	<FullPageLoader/>
				}
			</Route>
		</Switch>
	);
};

export default App;

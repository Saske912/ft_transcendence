import { configureStore } from '@reduxjs/toolkit';
import allUsersReducer from 'store/reducers/allUsersSlice';
import currentUserReducer from 'store/reducers/currentUserSlice';
import enemyReducer from 'store/reducers/enemySlice';
import gameReducer from 'store/reducers/gameSlice';
import messengerReducer from 'store/reducers/messengerSlice';
import onlineUsersReducer from 'store/reducers/onlineUsersSlice';
import socketReducer from 'store/reducers/socketSlice';
import statusReducer from 'store/reducers/statusSlice';

export const store = configureStore({
	reducer: {
		currentUser: currentUserReducer,
		allUsers: allUsersReducer,
		onlineUsers: onlineUsersReducer,
		status: statusReducer,
		enemy: enemyReducer,
		game: gameReducer,
		socket: socketReducer,
		messenger: messengerReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

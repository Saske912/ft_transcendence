import { configureStore } from '@reduxjs/toolkit';
import allUsersReducer from "app/reducers/allUsersSlice";
import currentUserReducer from "app/reducers/currentUserSlice";
import onlineUsersReducer from "app/reducers/onlineUsersSlice";
import statusReducer from 'app/reducers/statusSlice';

export const store = configureStore({
	reducer: {
		currentUser: currentUserReducer,
		allUsers: allUsersReducer,
		onlineUsers: onlineUsersReducer,
		status: statusReducer
	},
	middleware: getDefaultMiddleware => getDefaultMiddleware({
		serializableCheck: false
	})
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
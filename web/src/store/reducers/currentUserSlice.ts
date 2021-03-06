import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import * as AuthApi from "api/auth";
import { getCurrentUser } from 'api/user';
import {IUser, User} from 'models/User';
import {getToken, removeToken} from "utils/token";

interface CurrentUserState {
	currentUser: IUser;
}

const initialState: CurrentUserState = {
	currentUser: {
		id: -1,
		username: '',
		urlAvatar: '',
		loginDate: 0,
		intraLogin: null,
		isAuthorized: !!getToken(),
	},
};

export const logoutAction = createAsyncThunk(
	'currentUser/logout',
	async () => {
		await AuthApi.logout();
	},
);

export const getCurrentUserAction = createAsyncThunk(
	'currentUser/getCurrentUser',
	async (sockId: string, { rejectWithValue }) => {
		try {
			const user = await getCurrentUser(sockId);

			if (user) {
				const { id, login, url_avatar } = user;
				const newUser = new User();
				newUser.id = id;
				newUser.username = login;
				newUser.urlAvatar = url_avatar;

				return newUser;
			}

			return rejectWithValue('');
		} catch {
			return rejectWithValue('');
		}
	},
);

export const currentUserSlice = createSlice({
	name: 'currentUser',
	initialState,
	reducers: {
		setCurrentUser: (state: CurrentUserState, action: PayloadAction<IUser>) => {
			state.currentUser = action.payload;
			state.currentUser.isAuthorized = true;
		},
		resetCurrentUser: (state: CurrentUserState) => {
			state.currentUser = {...initialState.currentUser};
		},
	},
	extraReducers: {
		[logoutAction.fulfilled.type]: (state) => {
			removeToken();
			state.currentUser = {...initialState.currentUser};
			state.currentUser.isAuthorized = false;
		},
		[getCurrentUserAction.fulfilled.type]: (state: CurrentUserState, action: PayloadAction<IUser>) => {
			state.currentUser = action.payload;
			state.currentUser.isAuthorized = true;
		},
		[getCurrentUserAction.rejected.type]: (state) => {
			removeToken();
			state.currentUser = initialState.currentUser;
		},
	},
});

export const { setCurrentUser, resetCurrentUser } = currentUserSlice.actions;

export default currentUserSlice.reducer;

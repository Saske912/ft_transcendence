import axios, {AxiosResponse} from "axios";
import {ApiUser, ApiUserLogin, IAuthIntraReq, IAuthIntraRes} from 'models/ApiTypes';
import {User} from "models/User";
import React from "react";
import {removeToken, setToken} from "utils/token";

import { api } from './api';

export enum LoginState {
	Default = 'default',
	Verification = 'verification',
}

export const login = (socketId: string) => {
	return api.get<ApiUser | null>('/auth', { params: { socketId } }).then((res) => res.data);
};

export const logout = () => {
	return api.post('/users/logout');
};

export const registry = () => {};

export const getCurrentUser = async (accessToken: string, socketId: string): Promise<User | null> => {
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
};

export const signIn = async (
	username: string,
	password: string,
	setUser: (usr: User) => void,
	setErrors: React.Dispatch<React.SetStateAction<string>>,
	socketId: string,
	setState: React.Dispatch<React.SetStateAction<LoginState>> | null,
	smsCode: string | null,
): Promise<void> => {
	const r = await axios
		.post<{ username: string; password: string; socketId: string, code: string | null }, AxiosResponse<ApiUserLogin>>("/users/login", {
			username,
			password,
			socketId,
			code: smsCode,
		})
		.then((res) => res.data)
		.catch(() => {
			setErrors("Login Error");

			return null;
		});

	if (!r) return;
	const { access_token: accessToken, twoFactorAuthentication } = r;

	if (twoFactorAuthentication && setState) {
		setState(LoginState.Verification);

		return;
	}

	if (accessToken) {
		setToken(accessToken);
		getCurrentUser(accessToken, socketId)
			.then((usr) => {
				if (usr) {
					setUser(usr);
				} else {
					removeToken();
				}
			});
	}
};

export const getUserFromIntra = async (
	authCode: string,
	socketId: string,
	smsCode: string | null = null,
	intraToken: string | null = null,
) => {
	const r = await axios
		.post<IAuthIntraReq , AxiosResponse<IAuthIntraRes>>('/auth/intra', {
			code: authCode || '',
			smsCode,
			intraToken,
		})
		.then((res) => res.data);

	if (r.twoFactorAuthentication)
		return { user: null, twoFactorAuthentication: true, access_token_intra: r.access_token };

	if (r.access_token) {
		setToken(r.access_token);

		const user = await getCurrentUser(r.access_token, socketId);

		return { user, twoFactorAuthentication: r.twoFactorAuthentication };
	}

	throw new Error('Unhandled');
};

export const verifySms = (code: string, phoneNumber: string) => {
	return api.get('/auth/verifySms', { params: { code, phoneNumber } })
		.then((res) => res.data);
};

export const sendSms = (phoneNumber: string) => {
	return api.get('/auth/sendSms', { params: { phoneNumber } })
		.then((res) => res.data);
};

export const disable2FA = () => {
	return api.post('/auth/disable2FA')
		.then((res) => res.data);
};

import "./styles.scss";

import {getUserFromIntra, LoginState, signIn} from "api/auth";
import CircleLoading from "components/CircleLoading";
import CodeVerification from "components/CodeVerification";
import {useAppDispatch, useAppSelector} from "hook/reduxHooks";
import { User } from "models/User";
import React, {FormEvent, useMemo} from "react";
import { Link, useHistory } from "react-router-dom";
import { setCurrentUser } from "store/reducers/currentUserSlice";
import styled from "styled-components";
import { removeToken } from "utils/token";

const LoginInput = styled.input`
	border-radius: 15px;
	width: calc(400px - 52px);
	border: 1px solid #2c3e50;
	outline: none;
	font-size: 20px;
	padding: 16px 26px;
	margin-bottom: 15px;
	transition: all 0.1s ease-in;
	background: transparent;
	color: white;

	&::selection {
		background: #29aa44;
	}

	&:focus {
		border-color: #29aa44;
	}
`;

const Login = () => {
	const history = useHistory();
	const {socket, socket: { id: socketId }} = useAppSelector((state) => state.socket);
	const dispatch = useAppDispatch();

	const [loginInput, setLoginInput] = React.useState<string>('');
	const [passwordInput, setPasswordInput] = React.useState<string>('');

	const [loginErrors, setLoginErrors] = React.useState<string>("");
	const [isLoading, setIsLoading] = React.useState<boolean>(false);
	const [state, setState] = React.useState<LoginState>(LoginState.Default);
	const [intraToken, setIntraToken] = React.useState<string | null>(null);
	const [authCode, setAuthCode] = React.useState<string | null>(null);

	React.useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const code = params.get("code");

		if (code)
			setAuthCode(code);

		return () => {
			setAuthCode(null);
		};
	}, []);

	React.useEffect(() => {
		let isMounted = true;

		if (!(authCode && socketId)) return ;

		getUserFromIntra(authCode, socketId)
			.then((res) => {
				if (!isMounted) return;

				if (!res) return;

				if (res.twoFactorAuthentication) {
					setState(LoginState.Verification);
					setIntraToken(res.access_token_intra);
				} else if (res.user) {
					dispatch(setCurrentUser(res.user));
				} else {
					setLoginErrors("Login Error");
					setIsLoading(false);
					removeToken();
				}
			})
			.catch(() => setLoginErrors('Login Error'))
			.finally(() => {
				if (!isMounted) return;
				setIsLoading(false);
				history.push("/login");
			});

		return () => {
			isMounted = false;
		};
	}, [history, authCode, socketId, dispatch]);

	const loginSubmit = useMemo(() => async (e: FormEvent) => {
		e.preventDefault();

		setIsLoading(true);
		signIn(
			loginInput,
			passwordInput,
			(usr: User) => dispatch(setCurrentUser(usr)),
			setLoginErrors,
			socket.id,
			setState,
			null,
		)
			.finally(() => setIsLoading(false));
	}, [dispatch, loginInput, passwordInput, socket.id]);

	const verifyCode = useMemo(() => (code: string) => {
		setIsLoading(true);
		signIn(
			loginInput,
			passwordInput,
			(usr: User) => dispatch(setCurrentUser(usr)),
			setLoginErrors,
			socket.id,
			setState,
			code,
		)
			.finally(() => setIsLoading(false));
	}, [dispatch, loginInput, passwordInput, socket.id]);

	const verifyCodeIntra = useMemo(() => (code: string) => {
		if (!authCode) return ;

		setIsLoading(true);
		getUserFromIntra(authCode, socketId, code, intraToken)
			.then((res) => {
				if (res?.user) {
					dispatch(setCurrentUser(res.user));
				} else {
					removeToken();
				}
			})
			.catch(() => setLoginErrors('Error'))
			.finally(() => setIsLoading(false));
	}, [authCode, dispatch, intraToken, socketId]);

	return (
		<div className="login-container">
			{
				state === LoginState.Default &&
				<>
					<h1>Login page</h1>
					<form onSubmit={loginSubmit}>
						<LoginInput
							name="login"
							type="text"
							placeholder="Login"
							autoComplete="username"
							onChange={(e) => setLoginInput(e.target.value)}
						/>
						<LoginInput
							name="password"
							type="password"
							placeholder="Password"
							autoComplete="current-password"
							onChange={(e) => setPasswordInput(e.target.value)}
						/>
						<span className="login-errors">{loginErrors}</span>
						<button type="submit" className="login-btn">
							{isLoading ? <CircleLoading bgColor="#fff" width="35px" height="35px" /> : "Log in"}
						</button>
					</form>

					<Link to="/register" className="register-link">
						Register
					</Link>

					<span className="separator">Or</span>

					<div className="login-services">
						{
							authCode ? (
								<div className="login-service login-btn">
									<CircleLoading bgColor="#fff" width="35px" height="35px" />
								</div>
							) : (
								<a
									className="login-service login-btn"
									href={
										`https://api.intra.42.fr/oauth/authorize/?` +
										`client_id=${process.env.REACT_APP_INTRA_UID}&` +
										`redirect_uri=${encodeURIComponent(`${process.env.REACT_APP_INTRA_REDIRECT}`)}&` +
										"response_type=code"
									}
									rel="noreferrer"
								>
									Sign in with
									<div className="login-service-icon" />
								</a>
							)
						}
					</div>
				</>
			}
			{
				state === LoginState.Verification &&
					<>
						<h1>Enter verification code</h1>
						<form onSubmit={(e) => e.preventDefault()}>
							<CodeVerification submit={authCode ? verifyCodeIntra : verifyCode}/>
							<div style={{height: 25}}/>
							<span className="login-errors">{loginErrors}</span>
							<div style={{height: 15}}/>
							{
								isLoading ? (
									<div className="login-service login-btn">
										<CircleLoading bgColor="#fff" width="35px" height="35px" />
									</div>
								) : (
									<button onClick={() => setState(LoginState.Default)} type='button' className='login-btn'>
										Back
									</button>
								)
							}
						</form>
					</>
			}
		</div>
	);
};

export default Login;

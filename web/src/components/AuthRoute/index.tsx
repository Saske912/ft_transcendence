import { useAuth } from "hook/useAuth";
import { Redirect, Route, RouteProps } from "react-router-dom";

export const AuthRoute = ({ children, ...rest }: RouteProps) => {
	const isAuth = useAuth();

	return (
		<Route
			{...rest}
			render={({ location }) =>
				isAuth ? (
					<Redirect
						to={{
							pathname: "/",
							state: { from: location },
						}}
					/>
				) : (
					children
				)
			}
		/>
	);
};

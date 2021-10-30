import './styles.scss';

import Header from "components/Header";
import { User } from "models/User";
import React from 'react';
import { useHistory } from "react-router-dom";

import { ApiUserStatus } from "../../models/apiTypes";

interface ChatProps {
	currentUser: User,
	setCurrentUser: React.Dispatch<React.SetStateAction<User> >,
	status: ApiUserStatus
}

const Chat = ({ currentUser, setCurrentUser, status }: ChatProps) => {
	const history = useHistory();

	React.useEffect(() => {
		if (!currentUser.isAuthorized())
			history.push('/login');
	}, [history, currentUser]);

	return (
		<div className='chat-container'>
			<Header
				currentUser={currentUser}
				setCurrentUser={setCurrentUser}
				status={status}
			/>
			Chat view
		</div>
	);
};

export default Chat;

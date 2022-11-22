import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as MessengerApi from 'api/messenger';
import { useAppDispatch, useAppSelector } from "hook/reduxHooks";
import { ApiUserExpand } from 'models/ApiTypes';
import { useCallback } from "react";
import { setDefaultChatState } from "store/reducers/messengerSlice";

const CreateChat = () => {
	const { allUsers } = useAppSelector((state) => state.allUsers);
	const { currentUser } = useAppSelector((state) => state.currentUser);
	const { chats } = useAppSelector((state) => state.messenger);
	const dispatch = useAppDispatch();

	const chatsToCreate: ApiUserExpand[] = allUsers.filter(
		(usr) =>
			!chats.find((chat) => chat.userOne.id === usr.id || chat.userTwo.id === usr.id) &&
			usr.id !== currentUser.id,
	);

	const createChat = useCallback((usr: ApiUserExpand) => {
		MessengerApi.createChat(usr.id)
			.then(() => dispatch(setDefaultChatState()));
	}, [dispatch]);

	return (
		<div className="messenger-chat">
			<div className="messenger-chat-info">
				<div>Create a new chat</div>
				<button
					className="messenger-chat-close-btn"
					onClick={() => dispatch(setDefaultChatState())}
					title="Close"
				>
					<FontAwesomeIcon icon={faTimes} />
				</button>
			</div>
			<div className="messenger-create-chat">
				<p>Select a user</p>
				{chatsToCreate
					.map((usr) => (
						<button
							className="messenger-create-chat-user"
							key={usr.id}
							onClick={() => createChat(usr)}
						>
							<div
								className="messenger-create-chat-user-img"
								style={{ backgroundImage: `url(${usr.url_avatar})` }}
							/>
							<div className="messenger-create-chat-user-login">{usr.login}</div>
						</button>
					))}
			</div>
		</div>
	);
};

export default CreateChat;

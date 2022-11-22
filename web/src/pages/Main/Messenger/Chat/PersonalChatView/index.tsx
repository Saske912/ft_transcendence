import { faPaperPlane, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppDispatch, useAppSelector } from "hook/reduxHooks";
import { ApiChatExpand } from "models/ApiTypes";
import moment from "moment";
import Message from "pages/Main/Messenger/Chat/Message";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { closeSelectedChat } from "store/reducers/messengerSlice";

import { ISendMessage } from "../index";
import BanButton from "./BanButton";
import DuelButton from "./DuelButton";

interface PersonalChatViewProps {
	selectedChat: ApiChatExpand;
}

const PersonalChatView = ({ selectedChat }: PersonalChatViewProps) => {
	const { register, handleSubmit, reset } = useForm<ISendMessage>();
	const { currentUser } = useAppSelector((state) => state.currentUser);
	const { socket } = useAppSelector((state) => state.socket);
	const companion = selectedChat.userOne?.login === currentUser.username ? selectedChat.userTwo : selectedChat.userOne;
	const dispatch = useAppDispatch();

	let sendMsgPlaceholder: string;
	const ban = selectedChat.banLists.find(
		(list) =>
			list.chatId === selectedChat.id && (list.unbanDate === null || new Date(list.unbanDate) > new Date()),
	);
	const bannedByCurrentUser = ban && ban.initiatorId === currentUser.id || false;

	if (ban?.memberId === currentUser.id) {
		if (ban?.unbanDate === null) {
			sendMsgPlaceholder = 'You are muted';
		} else {
			sendMsgPlaceholder = `You are muted until ${moment(ban.unbanDate).format('DD MMMM YYYY, HH:mm')}`;
		}
	} else {
		sendMsgPlaceholder = 'Write a message';
	}

	const sendMsgSubmit = useCallback(({ message }: ISendMessage) => {
		const text = message.trim();

		if (text.length === 0) return;

		socket.emit('sendMessage', JSON.stringify({ text, chatId: selectedChat.id }));
		reset({ message: '' });
	}, [reset, selectedChat.id, socket]);

	return (
		<div className="messenger-chat">
			<div className="messenger-chat-info">
				<Link className="messenger-chat-info-companion" to={`/users/${companion.login}`}>
					<div
						className="messenger-chat-info-img"
						style={{ backgroundImage: `url(${companion.url_avatar})` }}
					/>
					<div>{companion.login}</div>
				</Link>
				<BanButton
					selectedChat={selectedChat}
					companion={companion}
					bannedByCurrentUser={bannedByCurrentUser}
					ban={ban}
				/>
				<DuelButton selectedChat={selectedChat} companion={companion} />
				<button
					className="messenger-chat-close-btn"
					onClick={() => dispatch(closeSelectedChat())}
					title="Close"
				>
					<FontAwesomeIcon icon={faTimes} />
				</button>
			</div>
			<div className="messenger-chat-messages">
				{selectedChat.messages.map((msg) => (
					<Message key={msg.id} message={msg} isFromCompanion={msg.fromUserId !== currentUser.id} />
				))}
			</div>
			<form className="messenger-chat-form" onSubmit={handleSubmit(sendMsgSubmit)}>
				<input
					disabled={ban && !bannedByCurrentUser}
					className="messenger-chat-input"
					type="text"
					{...register('message')}
					placeholder={sendMsgPlaceholder}
				/>
				<button
					disabled={ban && !bannedByCurrentUser}
					type="submit"
					className="messenger-chat-send-btn"
				>
					<FontAwesomeIcon icon={faPaperPlane} />
				</button>
			</form>
		</div>
	);
};

export default PersonalChatView;

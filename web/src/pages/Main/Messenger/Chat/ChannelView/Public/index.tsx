import { faBullhorn, faPaperPlane, faSlidersH, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { joinChannel } from "api/messenger";
import { useAppDispatch, useAppSelector } from "hook/reduxHooks";
import { ApiBanList, ApiChannelExpand, ApiChannelMember } from "models/ApiTypes";
import moment from "moment";
import Message from "pages/Main/Messenger/Chat/Message";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { ChatState, closeSelectedChat, setChatState } from "store/reducers/messengerSlice";
import { getTargetUser } from "utils/getTargetUser";

import { ISendMessage } from "../../index";

interface PublicProps {
	selectedChannel: ApiChannelExpand;
	isMember?: ApiChannelMember;
}

const Public = ({ selectedChannel, isMember }: PublicProps) => {
	const { allUsers } = useAppSelector((state) => state.allUsers);
	const { currentUser } = useAppSelector((state) => state.currentUser);
	const { socket } = useAppSelector((state) => state.socket);
	const { register, handleSubmit, reset } = useForm<ISendMessage>();
	const dispatch = useAppDispatch();

	const setSettingsChatState = useCallback(() => {
		dispatch(setChatState(ChatState.Settings));
	}, [dispatch]);

	const sendMsgSubmit = useCallback(({ message }: ISendMessage) => {
		message = message.trim();

		if (message.length === 0) return;

		const data = {
			text: message,
			channelId: selectedChannel.id,
		};
		socket.emit('sendMessage', JSON.stringify(data));
		reset({ message: '' });
	}, [selectedChannel.id, reset, socket]);

	let sendMsgPlaceholder: string;
	let ban: ApiBanList | undefined;

	if (isMember && isMember.banLists) {
		ban = isMember.banLists.find(
			(list) =>
				list.channelId === selectedChannel.id &&
				(list.unbanDate === null || new Date(list.unbanDate) > new Date()),
		);
	}

	if (ban) {
		if (ban.unbanDate === null)
			sendMsgPlaceholder = 'You are muted';
		else
			sendMsgPlaceholder = `You are muted until ${moment(ban.unbanDate).format('DD MMMM YYYY, HH:mm')}`;
	} else {
		sendMsgPlaceholder = 'Write a message';
	}

	return (
		<div className="messenger-chat">
			<div className="messenger-chat-info">
				<div className="messenger-chat-info-channel">
					<div className="messenger-chat-info-img">
						<FontAwesomeIcon icon={faBullhorn} />
					</div>
					<div className="messenger-chat-info-name">
						<div className="messenger-chat-info-title">{selectedChannel.title}</div>
						<div className="messenger-chat-info-members">
							{ selectedChannel.members.length === 1 ? '1 member' : `${selectedChannel.members.length} members` }
						</div>
					</div>
				</div>
				<button className="messenger-chat-info-settings-btn" onClick={setSettingsChatState}>
					<FontAwesomeIcon icon={faSlidersH} />
				</button>
				<button className="messenger-chat-close-btn" onClick={() => dispatch(closeSelectedChat())} title="Close">
					<FontAwesomeIcon icon={faTimes} />
				</button>
			</div>
			<div className="messenger-chat-messages">
				{selectedChannel.messages.map((msg) => {
					const author = getTargetUser(allUsers, msg.fromUserId, 'id'); // allUsers.find((usr) => usr.id === msg.fromUserId);

					return (
						<Message
							key={msg.id}
							message={msg}
							isFromCompanion={msg.fromUserId !== currentUser.id}
							author={author ? { name: author.login, imageUrl: author.url_avatar } : { name: '', imageUrl: '' }}
						/>
					);
				})}
			</div>
			{isMember ? (
				<form className="messenger-chat-form" onSubmit={handleSubmit(sendMsgSubmit)}>
					<input
						disabled={!!ban}
						className="messenger-chat-input"
						type="text"
						{...register('message')}
						placeholder={sendMsgPlaceholder}
					/>
					<button disabled={!!ban} type="submit" className="messenger-chat-send-btn">
						<FontAwesomeIcon icon={faPaperPlane} />
					</button>
				</form>
			) : (
				<button
					className="messenger-chat-join-btn"
					onClick={() => joinChannel(selectedChannel.id)}
				>
					Join
				</button>
			)}
		</div>
	);
};

export default Public;

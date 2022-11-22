import { faCommentSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ApiChannelExpand, ApiChannelMember } from "models/ApiTypes";
import moment from "moment";

interface MuteIndicatorProps {
	member: ApiChannelMember;
	selectedChannel: ApiChannelExpand;
}

const MuteIndicator = ({ member, selectedChannel }: MuteIndicatorProps) => {
	const ban = member.banLists.find(
		(list) =>
			list.channelId === selectedChannel.id &&
			(list.unbanDate === null || new Date(list.unbanDate) >= new Date()),
	);

	if (ban)
		return (
			<span
				className="messenger-chat-settings-members-list__member-mute"
				data-muted-until={
					ban.unbanDate === null
						? 'Muted'
						: `Muted until ${moment(ban.unbanDate).format('DD MMMM YYYY, HH:mm')}`
				}
			>
				<FontAwesomeIcon icon={faCommentSlash} />
			</span>
		);

	return <span className="messenger-chat-settings-members-list__member-mute" />;
};

export default MuteIndicator;
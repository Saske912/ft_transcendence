import { useAppSelector } from "hook/reduxHooks";
import { ApiChannelExpand } from "models/ApiTypes";

import Private from "./Private";
import Public from "./Public";

interface ChannelViewProps {
	selectedChannel: ApiChannelExpand;
}

const ChannelView = ({ selectedChannel }: ChannelViewProps) => {
	const { currentUser } = useAppSelector((state) => state.currentUser);

	const isMember = selectedChannel.members.find((member) => member.id === currentUser.id);


	if (selectedChannel.isPrivate && !isMember)
		return (
			<Private selectedChannel={selectedChannel}/>
		);

	return (
		<Public selectedChannel={selectedChannel} isMember={isMember} />
	);
};

export default ChannelView;

import moment from "moment";
import Moment from "react-moment";

export const GameTime = ({ date }: { date: string }) => {
	const now = moment().format('DD.MM.YYYY');
	const gameDateDay = moment(date).format('DD.MM.YYYY');
	const yesterdayDay = moment().subtract(1, 'days').format('DD.MM.YYYY');
	const gameDateTime = moment(date).format('HH:mm');

	if (gameDateDay === now) return <div>{`Today, ${gameDateTime}`}</div>;

	if (gameDateDay === yesterdayDay) return <div>{`Yesterday, ${gameDateTime}`}</div>;

	return <Moment format="MM.DD.YYYY, HH:mm" date={date} />;
};

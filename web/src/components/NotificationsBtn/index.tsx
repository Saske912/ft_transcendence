import './styles.scss';

import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const NotificationsBtn = () => {
	const showAlert = () => {
		// eslint-disable-next-line
		alert('Comming soon...');
	};

	return (
		<button onClick={showAlert} className="notifications-btn_disabled" >
			<FontAwesomeIcon icon={faBell} />
		</button>
	);
};

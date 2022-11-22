import './styles.scss';
import 'react-phone-input-2/lib/style.css';

import { ChangePictureForm } from "components/ChangePictureForm";
import { ChangeUsernameForm } from "components/ChangeUsernameForm";
import { TwoFactorAuthenticationForm } from "components/TwoFactorAuthenticationForm";

const UserEditWindow = () =>
	(
		<div
			onClick={(e) => e.stopPropagation()}
			className="user-profile-header__edit-window-wrapper"
		>
			<div className="user-profile-header__edit-window">
				<ChangeUsernameForm/>
				<ChangePictureForm/>
				<TwoFactorAuthenticationForm/>
			</div>
		</div>
	);

export default UserEditWindow;

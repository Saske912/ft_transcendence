import './styles.scss';

interface ConfirmationWindowProps {
	title: string;
	okHandler: () => void;
	cancelHandler: () => void;
}

const ConfirmationWindow = ({ title, okHandler, cancelHandler }: ConfirmationWindowProps) => {
	return (
		<div className="confirmation-window-wrapper">
			<div className="confirmation-window">
				<p>{title}</p>
				<div className="confirmation-window-buttons">
					<button className="confirmation-window-ok-btn" onClick={okHandler}>
						Yes
					</button>
					<button className="confirmation-window-cancel-btn" onClick={cancelHandler}>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmationWindow;

import './styles.scss';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';

interface ListSectionProps {
	title: string;
	list: JSX.Element;
	linkTo?: string;
}

const ListSection = ({ title, list, linkTo }: ListSectionProps) => {
	return (
		<div className="list-section">
			<div className="list-section-title">
				<p>{title}</p>
				{linkTo && (
					<Link to={linkTo}>
						<FontAwesomeIcon icon={faArrowRight} />
					</Link>
				)}
			</div>
			<div className="list-section-list">
				{list}
			</div>
		</div>
	);
};

export default ListSection;

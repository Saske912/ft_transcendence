import './styles.scss';

import CircleLoading from 'components/CircleLoading';
import Header from 'components/Header';

const FullPageLoader = () => (
	<>
		<Header />
		<div className="full-page-loader-wrapper">
			<CircleLoading bgColor="#29aa44" />
		</div>
	</>
);

export default FullPageLoader;

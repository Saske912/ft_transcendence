import './styles.scss';

import { useMemo } from "react";

interface CircleLoadingProps {
	bgColor?: string;
	width?: string;
	height?: string;
}

const CircleLoading = ({ bgColor = '#000', width = '50px', height = '50px' }: CircleLoadingProps) => {

	const divArray = useMemo(() => {
		const arr = [];
		for (let i = 0; i < 12; ++i) arr.push(<div />);

		return arr;
	}, []);

	return (
		<div className="lds-spinner" style={{ width, height }}>
			{divArray.map((_item, i) => (
				// eslint-disable-next-line react/no-array-index-key
				<div key={i} style={{ backgroundColor: bgColor }} />
			))}
		</div>
	);
};

export default CircleLoading;

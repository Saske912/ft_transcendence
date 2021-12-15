import './styles.scss';

import React from 'react';

interface CircleLoadingProps {
	bgColor?: string;
	width?: string;
	height?: string;
}

const CircleLoading = ({ bgColor = '#000', width = '50px', height = '50px' }: CircleLoadingProps) => {
	const divArray = [];

	// TODO переписать на обычную верстку, т.к. каждый раз генерирует новый массив
	for (let i = 0; i < 12; ++i) divArray.push(<div />);

	return (
		<div className="lds-spinner" style={{ width, height }}>
			{divArray.map((item, i) => (
				// eslint-disable-next-line react/no-array-index-key
				<div key={i} style={{ backgroundColor: bgColor }} />
			))}
		</div>
	);
};

export default CircleLoading;

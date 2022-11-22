import { Link } from 'react-router-dom';
import styled from "styled-components";

const Wrapper = styled.div`
	min-height: 100vh;
	width: 100vw;
	overflow: auto;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
`;

const HomeLink = styled(Link)`
	color: white;
	font-size: 26px;
	border: 1px solid #29aa44;
	height: 50px;
	width: 200px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 18px;
	transition: all 0.1s ease-in-out;
	margin-top: 50px;

	&:hover {
		background-color: #29aa44;
		color: white;
	}
	&:active {
		opacity: 0.8;
	}
`;

const NotFound = () => {
	return (
		<Wrapper>
			<h1>Page not found</h1>
			<HomeLink to='/'>Home</HomeLink>
		</Wrapper>
	);
};

export default NotFound;

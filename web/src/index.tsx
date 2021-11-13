import './index.scss';

import App from 'App';
import axios from "axios";
import { socket, SocketContext } from "context/socket";
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from "react-router-dom";

axios.defaults.baseURL = process.env.REACT_APP_API_URL;

ReactDOM.render(
		<React.StrictMode>
			<SocketContext.Provider value={ socket }>
				<Router>
					<App/>
				</Router>
			</SocketContext.Provider>
		</React.StrictMode>,
		document.getElementById('root')
);

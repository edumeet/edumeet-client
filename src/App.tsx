/* eslint-disable no-shadow */
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { RootState } from './store/store';
import Join from './views/join/Join';
import Lobby from './views/lobby/Lobby';
import Room from './views/room/Room';

const App = () => {
	const joined = useSelector((state: RootState) => state.room.joined);
	const inLobby = useSelector((state: RootState) => state.room.inLobby);

	const id = useParams().id?.toLowerCase() || 'invalid';

	if (joined)
		return (<Room />);
	else if (inLobby)
		return (<Lobby />);
	else
		return (<Join roomId={id} />);
};

export default App;
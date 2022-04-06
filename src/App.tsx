import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { startListeners } from './store/actions/startActions';
import { useAppDispatch, useAppSelector } from './store/hooks';
import StyledBackground from './components/StyledBackground';
import Join from './views/join/Join';
import Lobby from './views/lobby/Lobby';
import Room from './views/room/Room';

type AppParams = {
	id: string;
};

const App = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const joined = useAppSelector((state) => state.room.joined);
	const inLobby = useAppSelector((state) => state.room.inLobby);

	const id = (useParams<keyof AppParams>() as AppParams).id.toLowerCase();

	useEffect(() => {
		dispatch(startListeners());
	}, []);

	return (
		<StyledBackground>
			{ joined ? <Room /> : inLobby ? <Lobby /> : <Join roomId={id} /> }
		</StyledBackground>
	);
};

export default App;
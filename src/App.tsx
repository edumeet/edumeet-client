import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { startListeners } from './store/actions/startActions';
import { useAppDispatch, useAppSelector, useNotifier } from './store/hooks';
import StyledBackground from './components/StyledBackground';
import Join from './views/join/Join';
import Lobby from './views/lobby/Lobby';
import Room from './views/room/Room';
import { sendFiles } from './store/actions/filesharingActions';
import { uiActions } from './store/slices/uiSlice';

type AppParams = {
	id: string;
};

const App = (): JSX.Element => {
	useNotifier();
	const dispatch = useAppDispatch();
	const joined = useAppSelector((state) => state.room.joined);
	const inLobby = useAppSelector((state) => state.room.inLobby);

	const id = (useParams<keyof AppParams>() as AppParams).id.toLowerCase();

	useEffect(() => {
		dispatch(startListeners());
	}, []);

	const handleFileDrop = (event: React.DragEvent<HTMLDivElement>): void => {
		if (!joined) return;

		event.preventDefault();

		const droppedFiles = event.dataTransfer.files;

		if (droppedFiles?.length) {
			dispatch(uiActions.setUi({ filesharingOpen: true }));
			dispatch(sendFiles(droppedFiles));
		}
	};

	return (
		<StyledBackground
			onDrop={handleFileDrop}
			onDragOver={(event) => event.preventDefault()}
		>
			{ joined ? <Room /> : inLobby ? <Lobby /> : <Join roomId={id} /> }
		</StyledBackground>
	);
};

export default App;
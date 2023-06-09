import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { startListeners, stopListeners } from './store/actions/startActions';
import {
	useAppDispatch,
	useAppSelector,
	useNotifier,
	usePermissionSelector
} from './store/hooks';
import StyledBackground from './components/StyledBackground';
import Join from './views/join/Join';
import Lobby from './views/lobby/Lobby';
import Room from './views/room/Room';
import { sendFiles } from './store/actions/filesharingActions';
import { uiActions } from './store/slices/uiSlice';
import { roomActions, RoomConnectionState } from './store/slices/roomSlice';
import { permissions } from './utils/roles';

type AppParams = {
	id: string;
};

const App = (): JSX.Element => {
	useNotifier();
	const backgroundImage = useAppSelector((state) => state.room.backgroundImage);
	const dispatch = useAppDispatch();
	const roomState = useAppSelector((state) => state.room.state) as RoomConnectionState;
	const id = (useParams<AppParams>() as AppParams).id.toLowerCase();
	const hasFilesharingPermission = usePermissionSelector(permissions.SHARE_FILE);

	useEffect(() => {
		dispatch(startListeners());

		return () => {
			dispatch(stopListeners());
			dispatch(roomActions.setState('new'));
		};
	}, []);

	const handleFileDrop = (event: React.DragEvent<HTMLDivElement>): void => {
		event.preventDefault();

		if (roomState !== 'joined' || !hasFilesharingPermission) return;

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
			backgroundimage={backgroundImage}
		>
			{
				roomState === 'joined' ?
					<Room /> : roomState === 'lobby' ?
						<Lobby /> : roomState === 'new' && <Join roomId={id} />
			}
		</StyledBackground>
		
	);
};

export default App;
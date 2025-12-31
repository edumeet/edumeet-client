import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { startListeners, stopListeners } from './store/actions/startActions';
import { useAppDispatch, useAppSelector, usePermissionSelector } from './store/hooks';
import StyledBackground from './components/StyledBackground';
import Join from './views/join/Join';
import Lobby from './views/lobby/Lobby';
import Room from './views/room/Room';
import { sendFiles } from './store/actions/filesharingActions';
import { uiActions } from './store/slices/uiSlice';
import { roomActions } from './store/slices/roomSlice';
import { permissions } from './utils/roles';
import { SnackbarKey, SnackbarProvider, useSnackbar } from 'notistack';
import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { meActions } from './store/slices/meSlice';
import edumeetConfig from './utils/edumeetConfig';
import VideoBackgroundDialog from './components/backgroundselectdialog/VideoBackgroundDialog';

type AppParams = {
	id: string;
};

interface SnackbarCloseButtonProps {
	snackbarKey: SnackbarKey;
}

const SnackbarCloseButton = ({
	snackbarKey
}: SnackbarCloseButtonProps): React.JSX.Element => {
	const { closeSnackbar } = useSnackbar();

	return (
		<IconButton onClick={() => closeSnackbar(snackbarKey)}>
			<Close />
		</IconButton>
	);
};

const App = (): React.JSX.Element => {
	const roomBackgroundImage = useAppSelector((state) => state.room.backgroundImage);
	const userBackgroundImage = useAppSelector((state) => state.me.selectedDestop?.imageUrl);
	const dispatch = useAppDispatch();
	const roomState = useAppSelector((state) => state.room.state);
	const id = (useParams<AppParams>() as AppParams).id.toLowerCase();
	const hasFilesharingPermission = usePermissionSelector(permissions.SHARE_FILE);
	const navigate = useNavigate();

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

	useEffect(() => {
		if (roomState ==='left') {
			if (id && edumeetConfig.keepRoomNameOnLeave)
				navigate(`/${id}`);
			else
				navigate('/');

			setTimeout(() => {
				window.location.reload();
			}, 0);
		}
	}, [ roomState, id, edumeetConfig.keepRoomNameOnLeave ]);

	/**
	 * Detect WebGL-support.
	 */
	useEffect(() => {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

		if (gl && gl instanceof WebGLRenderingContext) {
			dispatch(meActions.setWebGLSupport(true));
		} 
	}, []);

	return (
		<>
			<SnackbarProvider action={ (snackbarKey: SnackbarKey) => <SnackbarCloseButton snackbarKey={snackbarKey} /> }>
				<StyledBackground
					onDrop={handleFileDrop}
					onDragOver={(event) => event.preventDefault()}
					backgroundimage={userBackgroundImage || roomBackgroundImage || edumeetConfig.theme.backgroundImage}
				>
					{ roomState === 'joined' ? <Room /> : roomState === 'lobby' ? <Lobby /> : roomState === 'new' && <Join roomId={id} /> }
				</StyledBackground>
			</SnackbarProvider>
			<VideoBackgroundDialog />
		</>
	);
};

export default App;

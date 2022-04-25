import {
	Button,
	DialogActions,
	DialogTitle,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import StyledDialog from '../dialog/StyledDialog';
import {
	CloseMessage,
	LobbyAdministrationMessage,
	PromotePeersMessage,
} from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import { promotePeers } from '../../store/actions/permissionsActions';

const LobbyDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const lobbyDialogOpen = useAppSelector((state) => state.ui.lobbyDialogOpen);
	const lobbyPeersPromotionInProgress =
		useAppSelector((state) => state.room.lobbyPeersPromotionInProgress);

	const handleCloseLobbyDialog = (): void => {
		dispatch(uiActions.setUi({
			lobbyDialogOpen: !lobbyDialogOpen
		}));
	};

	const handlePromotePeers = (): void => {
		dispatch(promotePeers());
		dispatch(uiActions.setUi({
			lobbyDialogOpen: !lobbyDialogOpen
		}));
	};

	return (
		<StyledDialog
			open={lobbyDialogOpen}
			onClose={handleCloseLobbyDialog}
		>
			<DialogTitle>
				<LobbyAdministrationMessage />
			</DialogTitle>
			{/* TODO: Add list of peers in lobby */}
			<DialogActions>
				<Button
					disabled={lobbyPeersPromotionInProgress}
					onClick={handlePromotePeers}
				>
					<PromotePeersMessage />
				</Button>
				<Button
					onClick={handleCloseLobbyDialog}
					startIcon={<CloseIcon />}
				>
					<CloseMessage />
				</Button>
			</DialogActions>
		</StyledDialog>
	);
};

export default LobbyDialog;
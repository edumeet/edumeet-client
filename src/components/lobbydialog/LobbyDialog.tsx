import {
	Button,
	DialogActions,
	DialogContent,
	DialogTitle,
	List,
	ListSubheader,
} from '@mui/material';
import { useAppDispatch, useAppSelector, usePermissionSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import StyledDialog from '../dialog/StyledDialog';
import {
	CloseMessage,
	LobbyAdministrationMessage,
	PeersInLobbyMessage,
	PromotePeersMessage,
} from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import { promotePeers } from '../../store/actions/permissionsActions';
import { LobbyPeer } from '../../store/slices/lobbyPeersSlice';
import { permissions } from '../../utils/roles';
import ListLobbyPeer from './ListLobbyPeer';

const LobbyDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const canPromote = usePermissionSelector(permissions.PROMOTE_PEER);
	const lobbyPeers = useAppSelector((state) => state.lobbyPeers) as LobbyPeer[];
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
			open={canPromote && lobbyDialogOpen}
			onClose={handleCloseLobbyDialog}
		>
			<DialogTitle>
				<LobbyAdministrationMessage />
			</DialogTitle>
			<DialogContent>
				<List
					dense
					subheader={
						<ListSubheader component='div'>
							<PeersInLobbyMessage />
						</ListSubheader>
					}
				>
					{ lobbyPeers.map((peer) => (
						<ListLobbyPeer
							key={peer.id}
							peer={peer}
							canPromote={canPromote}
						/>
					)) }

				</List>
			</DialogContent>
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
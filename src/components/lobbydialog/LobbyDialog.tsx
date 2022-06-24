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
import { closeLabel, lobbyAdministrationLabel, peersInLobbyLabel, promotePeersLabel } from '../translated/translatedComponents';
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
				{ lobbyAdministrationLabel() }
			</DialogTitle>
			<DialogContent>
				<List
					dense
					subheader={
						<ListSubheader component='div'>
							{ peersInLobbyLabel() }
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
					disabled={lobbyPeersPromotionInProgress || lobbyPeers.length === 0}
					onClick={handlePromotePeers}
				>
					{ promotePeersLabel() }
				</Button>
				<Button
					onClick={handleCloseLobbyDialog}
					startIcon={<CloseIcon />}
				>
					{ closeLabel() }
				</Button>
			</DialogActions>
		</StyledDialog>
	);
};

export default LobbyDialog;
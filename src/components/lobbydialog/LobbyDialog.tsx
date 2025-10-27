import { Button, List } from '@mui/material';
import { useAppDispatch, useAppSelector, usePermissionSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { closeLabel, peersInLobbyLabel, promotePeersLabel } from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import { promotePeers } from '../../store/actions/permissionsActions';
import { LobbyPeer } from '../../store/slices/lobbyPeersSlice';
import { permissions } from '../../utils/roles';
import ListLobbyPeer from './ListLobbyPeer';
import GenericDialog from '../genericdialog/GenericDialog';

const LobbyDialog = (): React.JSX.Element => {
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
		<GenericDialog
			open={canPromote && lobbyDialogOpen}
			onClose={handleCloseLobbyDialog}
			maxWidth='xs'
			title={peersInLobbyLabel()}
			content={
				<List>
					{ lobbyPeers.map((peer) => (
						<ListLobbyPeer key={peer.id} peer={peer} canPromote={canPromote} />
					)) }
				</List>
			}
			actions={
				<>
					<Button
						disabled={lobbyPeersPromotionInProgress || lobbyPeers.length === 0}
						onClick={handlePromotePeers}
						variant='contained'
						size='small'
					>
						{ promotePeersLabel() }
					</Button>
					<Button
						onClick={handleCloseLobbyDialog}
						startIcon={<CloseIcon />}
						variant='contained'
						size='small'
					>
						{ closeLabel() }
					</Button>
				</>
			}
		/>
	);
};

export default LobbyDialog;
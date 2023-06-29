import { ListItem, ListItemSecondaryAction, Typography } from '@mui/material';
import { memo } from 'react';
import { LobbyPeer } from '../../store/slices/lobbyPeersSlice';
import PromoteButton from '../controlbuttons/PromoteButton';

interface ListLobbyPeerProps {
	peer: LobbyPeer;
	canPromote: boolean;
}

const ListLobbyPeer = ({
	peer,
	canPromote,
}: ListLobbyPeerProps): JSX.Element => {
	return (
		<ListItem alignItems='flex-start'>
			<Typography>{ peer.displayName }</Typography>
			<ListItemSecondaryAction>
				<PromoteButton
					peer={peer}
					canPromote={canPromote}
					disabled={!canPromote}
					type='iconbutton'
				/>
			</ListItemSecondaryAction>
		</ListItem>
	);
};

export default memo(ListLobbyPeer);
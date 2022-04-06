import { IconButton, styled } from '@mui/material';
import { green } from '@mui/material/colors';
import { Peer } from '../../store/slices/peersSlice';
import PanIcon from '@mui/icons-material/PanTool';

interface ListPeerProps {
	peer: Peer;
	spotlight?: boolean;
	selected?: boolean;
	isModerator?: boolean;
}

const PeerDiv = styled('div')({
	width: '100%',
	overflow: 'hidden',
	cursor: 'auto',
	display: 'flex'
});

const PeerInfoDiv = styled('div')(({ theme }) => ({
	fontSize: '1rem',
	display: 'flex',
	paddingLeft: theme.spacing(1),
	flexGrow: 1,
	alignItems: 'center'
}));

const ListPeer = ({
	peer,
	// spotlight,
	// selected,
	isModerator
}: ListPeerProps): JSX.Element => {

	return (
		<PeerDiv>
			<PeerInfoDiv>{ peer.displayName }</PeerInfoDiv>
			{ peer.raisedHand &&
				<IconButton
					style={{ color: green[500] }}
					disabled={!isModerator || peer.raisedHandInProgress}
				>
					<PanIcon />
				</IconButton>
			}
		</PeerDiv>
	);
};

export default ListPeer;
import { IconButton, styled } from '@mui/material';
import { Peer } from '../../store/slices/peersSlice';
import PanIcon from '@mui/icons-material/PanTool';
import { useAppDispatch, usePeerConsumers } from '../../store/hooks';
import { lowerPeerHand } from '../../store/actions/peerActions';
import Volume from '../volume/Volume';

interface ListPeerProps {
	peer: Peer;
	isModerator: boolean;
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
	isModerator
}: ListPeerProps): JSX.Element => {
	const dispatch = useAppDispatch();

	const {
		micConsumer,
		webcamConsumer,
		screenConsumer,
		extraVideoConsumers
	} = usePeerConsumers(peer.id);

	return (
		<PeerDiv>
			<PeerInfoDiv>{ peer.displayName }</PeerInfoDiv>
			{ peer.raisedHand &&
				<IconButton
					disabled={!isModerator || peer.raisedHandInProgress}
					onClick={(): void => {
						dispatch(lowerPeerHand(peer.id));
					}}
				>
					<PanIcon />
				</IconButton>
			}
			{ micConsumer && <Volume consumer={micConsumer} small /> }
		</PeerDiv>
	);
};

export default ListPeer;
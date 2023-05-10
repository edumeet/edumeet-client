import { Box, IconButton, Paper, styled } from '@mui/material';
import { Peer } from '../../store/slices/peersSlice';
import PanIcon from '@mui/icons-material/PanTool';
import { useAppDispatch, usePeerConsumers } from '../../store/hooks';
import { lowerPeerHand } from '../../store/actions/peerActions';
import Volume from '../volume/Volume';
import { useState } from 'react';
import MoreIcon from '@mui/icons-material/MoreVert';
import PeerMenu from '../peermenu/PeerMenu';
import ScreenShareIcon from '@mui/icons-material/ScreenShareOutlined';
import MicMutedIcon from '@mui/icons-material/MicOffOutlined';
import MicUnMutedIcon from '@mui/icons-material/MicNoneOutlined';
import WebcamIcon from '@mui/icons-material/VideocamOutlined';

interface ListPeerProps {
	peer: Peer;
	isModerator: boolean;
}

const PeerDiv = styled(Paper)(({ theme }) => ({
	display: 'flex',
	padding: theme.spacing(0.5),
	marginTop: theme.spacing(0.5),
}));

const PeerInfoDiv = styled(Box)(({ theme }) => ({
	display: 'flex',
	marginLeft: theme.spacing(1),
	flexGrow: 1,
	alignItems: 'center'
}));

const ScreenShareStatus = styled(ScreenShareIcon)(({ theme }) => ({
	marginRight: theme.spacing(0.5),
	alignSelf: 'center'
}));

const MicMuted = styled(MicMutedIcon)(({ theme }) => ({
	marginRight: theme.spacing(0.5),
	alignSelf: 'center'
}));

const MicUnMuted = styled(MicUnMutedIcon)(({ theme }) => ({
	marginRight: theme.spacing(0.5),
	alignSelf: 'center'
}));

const WebcamEnabled = styled(WebcamIcon)(({ theme }) => ({
	marginRight: theme.spacing(0.5),
	alignSelf: 'center'
}));

const PeerAvatar = styled('img')({
	borderRadius: '50%',
	height: '2rem',
	width: '2rem',
	objectFit: 'cover',
	alignSelf: 'center',
});

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

	const shouldShow = (isModerator || micConsumer || webcamConsumer || screenConsumer || extraVideoConsumers.length !== 0);

	const [ moreAnchorEl, setMoreAnchorEl ] = useState<HTMLElement | null>();

	const handleMenuClose = () => {
		setMoreAnchorEl(null);
	};

	return (
		<>
			<PeerDiv>
				<PeerAvatar src={peer.picture ?? '/images/buddy.svg'} />
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
				{ (micConsumer && !micConsumer.localPaused && !micConsumer.remotePaused && 
					<MicUnMuted />) || (micConsumer && <MicMuted />) }
				{ (webcamConsumer && !webcamConsumer.localPaused && 
					!webcamConsumer.remotePaused && <WebcamEnabled />) }
				{ screenConsumer && <ScreenShareStatus /> }
				{ shouldShow && 
					<IconButton
						aria-haspopup
						onClick={(event) => {
							setMoreAnchorEl(event.currentTarget);
						}}
						color='inherit'
					>
						<MoreIcon />
					</IconButton>
				}
			</PeerDiv>
			<PeerMenu
				anchorEl={moreAnchorEl}
				peerId={peer.id}
				onClick={handleMenuClose}
			/>
		</>
	);
};

export default ListPeer;
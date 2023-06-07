import { Box, Chip, IconButton, Paper, styled } from '@mui/material';
import { Peer } from '../../store/slices/peersSlice';
import PanIcon from '@mui/icons-material/BackHand';
import { useAppDispatch, usePeerConsumers } from '../../store/hooks';
import { lowerPeerHand } from '../../store/actions/peerActions';
import Volume from '../volume/Volume';
import { useState } from 'react';
import MoreIcon from '@mui/icons-material/MoreVert';
import PeerMenu from '../peermenu/PeerMenu';
import ScreenShareIcon from '@mui/icons-material/ScreenShareOutlined';
import MicUnMutedIcon from '@mui/icons-material/MicNoneOutlined';
import WebcamIcon from '@mui/icons-material/VideocamOutlined';

interface ListPeerProps {
	peer: Peer;
	isModerator: boolean;
}

const StyledChip = styled(Chip)(({ theme }) => ({
	alignItems: 'start',
	marginRight: theme.spacing(0.5),
}));

const PeerDiv = styled(Paper)(({ theme }) => ({
	display: 'flex',
	padding: theme.spacing(0.5),
	marginTop: theme.spacing(0.5),
	alignItems: 'center',
}));

const PeerInfoDiv = styled(Box)(({ theme }) => ({
	display: 'flex',
	marginLeft: theme.spacing(1),
	flexGrow: 1,
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

	const hasAudio = micConsumer && !micConsumer.localPaused && !micConsumer.remotePaused;
	const hasVideo = webcamConsumer && !webcamConsumer.localPaused && !webcamConsumer.remotePaused;
	const hasScreen = screenConsumer && !screenConsumer.localPaused && !screenConsumer.remotePaused;

	/* const hasMedia = hasAudio || hasVideo || hasScreen;

	const MediaIcons = (): JSX.Element => (
		<>
			{ hasScreen && <ScreenShareIcon /> }
			{ hasVideo && <WebcamIcon /> }
			{ hasAudio && <MicUnMutedIcon /> }
		</>
	); */

	return (
		<>
			<PeerDiv>
				<PeerAvatar src={peer.picture ?? '/images/buddy.svg'} />
				{ peer.raisedHand &&
					<IconButton
						disabled={!isModerator || peer.raisedHandInProgress}
						onClick={(): void => {
							dispatch(lowerPeerHand(peer.id));
						}}
						size='small'
					>
						<PanIcon />
					</IconButton>
				}
				<PeerInfoDiv>{ peer.displayName }</PeerInfoDiv>
				{ /* hasMedia && <StyledChip disabled label={<MediaIcons />} variant='outlined' size='small' /> */ }
				{ hasScreen && <StyledChip disabled label={<ScreenShareIcon fontSize='small' />} variant='filled' size='small' /> }
				{ hasVideo && <StyledChip disabled label={<WebcamIcon fontSize='small' />} variant='filled' size='small' /> }
				{ hasAudio && <StyledChip disabled label={<MicUnMutedIcon fontSize='small' />} variant='filled' size='small' /> }
				<Volume consumer={micConsumer} small />
				{ shouldShow && 
					<IconButton
						aria-haspopup
						onClick={(event) => {
							setMoreAnchorEl(event.currentTarget);
						}}
						color='inherit'
						size='small'
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
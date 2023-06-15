import { Box, IconButton, Paper, styled } from '@mui/material';
import { Peer } from '../../store/slices/peersSlice';
import PanIcon from '@mui/icons-material/BackHand';
import { useAppDispatch, usePeerConsumers } from '../../store/hooks';
import { lowerPeerHand } from '../../store/actions/peerActions';
import Volume from '../volume/Volume';
import { useState } from 'react';
import PeerMenu from '../peermenu/PeerMenu';
import ScreenShareIcon from '@mui/icons-material/ScreenShareOutlined';
import MicUnMutedIcon from '@mui/icons-material/MicNoneOutlined';
import WebcamIcon from '@mui/icons-material/VideocamOutlined';
import MoreButton from '../controlbuttons/MoreButton';

interface ListPeerProps {
	peer: Peer;
	isModerator: boolean;
}

const StyledIcons = styled(Box)(({ theme }) => ({
	display: 'flex',
	gap: theme.spacing(0.5),
	marginRight: theme.spacing(0.5),
	paddingLeft: theme.spacing(0.5),
	paddingRight: theme.spacing(0.5),
	paddingTop: theme.spacing(0.25),
	paddingBottom: theme.spacing(0.25),
	borderRadius: theme.roundedness,
	backgroundColor: theme.sideContentItemDarkColor,
}));

const PeerDiv = styled(Paper)(({ theme }) => ({
	display: 'flex',
	padding: theme.spacing(0.5),
	marginTop: theme.spacing(0.5),
	alignItems: 'center',
	backgroundColor: theme.sideContentItemColor,
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
	const { micConsumer, webcamConsumer, screenConsumer } = usePeerConsumers(peer.id);
	const [ moreAnchorEl, setMoreAnchorEl ] = useState<HTMLElement | null>();
	const handleMenuClose = () => setMoreAnchorEl(null);
	
	const shouldShow = Boolean(isModerator || micConsumer);
	const hasAudio = micConsumer && !micConsumer.localPaused && !micConsumer.remotePaused;
	const hasVideo = webcamConsumer && !webcamConsumer.localPaused && !webcamConsumer.remotePaused;
	const hasScreen = screenConsumer && !screenConsumer.localPaused && !screenConsumer.remotePaused;

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
				<StyledIcons>
					{ /* hasMedia && <StyledChip disabled label={<MediaIcons />} variant='outlined' size='small' /> */ }
					{ hasScreen && /* <StyledChip disabled label={ */ <ScreenShareIcon fontSize='small' /> /* } variant='filled' size='small' /> */ }
					{ hasVideo && /* <StyledChip disabled label={ */ <WebcamIcon fontSize='small' /> /* } variant='filled' size='small' /> */ }
					{ hasAudio && /* <StyledChip disabled label={ */ <MicUnMutedIcon fontSize='small' /> /* } variant='filled' size='small' /> */ }
				</StyledIcons>
				<Volume consumer={micConsumer} small />
				<MoreButton onClick={(event) => setMoreAnchorEl(event.currentTarget)} type='iconbutton' size='small' />
			</PeerDiv>
			{ shouldShow && <PeerMenu anchorEl={moreAnchorEl} peerId={peer.id} onClick={handleMenuClose} /> }
		</>
	);
};

export default ListPeer;
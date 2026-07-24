import { Chip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
	useAppDispatch,
	useAppSelector,
	usePeerConsumers,
} from '../../store/hooks';
import { activeSpeakerIdSelector, activeSpeakerIsAudioOnlySelector, audioOnlySessionPeersSelector } from '../../store/selectors';
import VideoBox from '../videobox/VideoBox';
import { uiActions } from '../../store/slices/uiSlice';
import DisplayName from '../displayname/DisplayName';
import Volume from '../volume/Volume';

interface AudioPeerBoxProps {
  peer: { id: string; displayName?: string };
  activeSpeakerId: string|undefined;
  style: { width?: string | number; height?: string | number };
}

const AudioPeerBox = ({ peer, activeSpeakerId, style }: AudioPeerBoxProps): React.JSX.Element => {
	// Correct hook usage: top-level of a component
	const consumers = usePeerConsumers(peer.id);
	const micConsumer = consumers?.micConsumer;

	return (
		<VideoBox
			activeSpeaker={peer.id === activeSpeakerId}
			order={10}
			width={style.width}
			height={style.height}
		>
			{micConsumer && <Volume consumer={micConsumer} />}
			<DisplayName displayName={peer?.displayName} peerId={peer.id} />
		</VideoBox>
	);
};

const StyledPeers = styled(Chip)(() => ({
	position: 'relative',
	width: '60%',
	height: '60%',
	left: '50%',
	top: '50%',
	transform: 'translate(-50%, -50%)',
	textAlign: 'center',
	color: 'white',
	'& .MuiChip-label': {
		display: 'block',
		whiteSpace: 'normal',
	},
}));

interface PeersProps {
	style: Record<'width' | 'height', number>
}

const Peers = ({ style }: PeersProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const participantListOpen = useAppSelector((state) => state.ui.participantListOpen);
	const openUsersTab = () => dispatch(uiActions.setUi({ participantListOpen: !participantListOpen }));
	const showAudioOnly = useAppSelector((state) => state.settings.showAudioOnly);
	const hideNonVideo = useAppSelector((state) => state.settings.hideNonVideo);
	const activeSpeaker = useAppSelector(activeSpeakerIsAudioOnlySelector);
	const headless = useAppSelector((state) => state.room.headless);
	const audioOnlyPeers = useAppSelector(audioOnlySessionPeersSelector);

	const visiblePeerNames = audioOnlyPeers.slice(0, 3);
	const rest = audioOnlyPeers.slice(3);

	const combinedPeerName = visiblePeerNames.map((peer) => {
		let displayName = peer.displayName || peer.id;

		if (displayName.length > 10) displayName = `${displayName.substring(0, 10)}...`;

		return displayName;
	}).join(', ');

	const audioactivespeaker = useAppSelector(activeSpeakerIdSelector);

	return (
		<>
			{ !hideNonVideo && !headless && audioOnlyPeers.length > 0 && !showAudioOnly && 
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={10}
					width={style.width}
					height={style.height}
				>
					<StyledPeers label={
						<>
							<Typography>
								{ combinedPeerName }
							</Typography>
							<Typography>
								{ rest.length > 0 && `and ${rest.length} more` }
							</Typography>
						</>
					} variant='filled' onClick={ () => openUsersTab() } />
				</VideoBox>
			}
			{ !hideNonVideo && !headless && audioOnlyPeers.length > 0 && showAudioOnly && 
				audioOnlyPeers.map((peer) => (
					
					<AudioPeerBox
						key={peer.id} // Don't forget a unique key!
						peer={peer}
						activeSpeakerId={audioactivespeaker}
						style={style}
					/>
				
				))
			}
		</>
	);
};

export default Peers;

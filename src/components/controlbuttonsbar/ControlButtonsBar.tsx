import { useAppSelector } from '../../store/hooks';
import MediaControls from '../../components/mediacontrols/MediaControls';
import MicButton from '../../components/controlbuttons/MicButton';
import WebcamButton from '../../components/controlbuttons/WebcamButton';
import ScreenshareButton from '../../components/controlbuttons/ScreenshareButton';
import RaiseHandButton from '../controlbuttons/RaiseHandButton';
import { isMobileSelector } from '../../store/selectors';
import ParticipantsButton from '../controlbuttons/ParticipantsButton';
import ChatButton from '../controlbuttons/ChatButton';
import FloatingMenu from '../floatingmenu/FloatingMenu';
import { useState } from 'react';
import ParticipantList from '../participantlist/ParticipantList';
import Chat from '../chat/Chat';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import ExtraVideo from '../menuitems/ExtraVideo';
import Transcription from '../menuitems/Transcription';
import Filesharing from '../menuitems/Filesharing';
import Recording from '../menuitems/Recording';
import MoreButton from '../controlbuttons/MoreButton';

interface ContainerProps {
	height: string;
	width?: string;
}

const Container = styled(Box)<ContainerProps>(({ height, width }) => ({
	height,
	width,
	overflowY: 'auto',
}));

const ControlButtonsBar = (): JSX.Element => {
	const isMobile = useAppSelector(isMobileSelector);
	const chatEnabled = useAppSelector((state) => state.room.chatEnabled);
	const filesharingEnabled = useAppSelector((state) => state.room.filesharingEnabled);
	const localRecordingEnabled = useAppSelector((state) => state.room.localRecordingEnabled);
	const canRecord = useAppSelector((state) => state.me.canRecord);
	const canTranscribe = useAppSelector((state) => state.me.canTranscribe);

	const [ participantListAnchorEl, setParticipantAnchorEl ] = useState<HTMLElement | null>();
	const isParticipantListOpen = Boolean(participantListAnchorEl);

	const handleParticipantListClose = () => setParticipantAnchorEl(null);

	const [ chatAnchorEl, setChatAnchorEl ] = useState<HTMLElement | null>();
	const isChatOpen = Boolean(chatAnchorEl);

	const handleChatClose = () => setChatAnchorEl(null);

	const [ moreAnchorEl, setMoreAnchorEl ] = useState<HTMLElement | null>();

	const handleMoreClose = () => {
		setMoreAnchorEl(null);
	};

	const isMoreOpen = Boolean(moreAnchorEl);

	return (
		<>
			<MediaControls
				orientation='horizontal'
				horizontalPlacement='center'
				verticalPlacement='bottom'
				autoHide={ false }
				fullsize={ false }
			>
				<MicButton offColor='error' toolTipLocation='bottom' />
				<WebcamButton offColor='error' toolTipLocation='bottom' />
				{ !isMobile && <ScreenshareButton toolTipLocation='bottom' /> }
				{ !isMobile && <RaiseHandButton toolTipLocation='bottom' /> }
				{ !isMobile && <ParticipantsButton toolTipLocation='bottom' onColor='primary' /> }
				{ isMobile && <ParticipantsButton onClick={(event) => setParticipantAnchorEl(event.currentTarget)} toolTipLocation='bottom' /> }
				{ !isMobile && chatEnabled && <ChatButton toolTipLocation='bottom' onColor='primary' /> }
				{ isMobile && chatEnabled && <ChatButton onClick={(event) => setChatAnchorEl(event.currentTarget)} toolTipLocation='bottom' /> }
				<MoreButton onClick={(event) => setMoreAnchorEl(event.currentTarget)} toolTipLocation='bottom' />
			</MediaControls>
			{ isMobile &&
				<FloatingMenu
					anchorEl={participantListAnchorEl}
					open={isParticipantListOpen}
					onClose={handleParticipantListClose}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				>
					<Container height='80vh' width='90vw'>
						<ParticipantList />
					</Container>
				</FloatingMenu>
			}
			{ chatEnabled && isMobile &&
				<FloatingMenu
					anchorEl={chatAnchorEl}
					open={isChatOpen}
					onClose={handleChatClose}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				>
					<Container height='80vh' width='90vw'>
						<Chat />
					</Container>
				</FloatingMenu>
			}
			<FloatingMenu
				anchorEl={moreAnchorEl}
				open={isMoreOpen}
				onClose={handleMoreClose}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
				transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<ExtraVideo onClick={handleMoreClose} />
				{ /* <ExtraAudio onClick={handleMoreClose} /> */ }
				{ filesharingEnabled && <Filesharing onClick={handleMoreClose} /> }
				{ canTranscribe && <Transcription onClick={handleMoreClose} /> }
				{ localRecordingEnabled && canRecord && <Recording onClick={handleMoreClose} /> }
			</FloatingMenu>
		</>
	);
};

export default ControlButtonsBar;
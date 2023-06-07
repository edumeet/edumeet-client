import { useEffect, useState } from 'react';
import fscreen from 'fscreen';
import Settings from '../../components/settingsdialog/SettingsDialog';
import TopBar from '../../components/topbar/TopBar';
import { usePrompt } from '../../store/hooks';
import FullscreenVideo from '../../components/fullscreenvideo/FullscreenVideo';
import WindowedVideo from '../../components/windowedvideo/WindowedVideo';
import AudioPeers from '../../components/audiopeers/AudioPeers';
import LobbyDialog from '../../components/lobbydialog/LobbyDialog';
import FilesharingDialog from '../../components/filesharingdialog/FilesharingDialog';
import ExtraVideoDialog from '../../components/extravideodialog/ExtraVideoDialog';
import ControlButtonsBar from '../../components/controlbuttonsbar/ControlButtonsBar';
import Help from '../../components/helpdialog/HelpDialog';
import MainContent from '../../components/maincontent/MainContent';
import HelpButton from '../../components/controlbuttons/HelpButton';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

const HelpContainer = styled(Box)(({ theme }) => ({
	position: 'absolute',
	bottom: theme.spacing(1),
	right: theme.spacing(1),
	color: 'white',
}));

const Room = (): JSX.Element => {
	const [ isFullscreen, setFullscreen ] = useState(false);

	usePrompt(true);

	useEffect(() => {
		if (fscreen.fullscreenEnabled)
			fscreen.addEventListener('fullscreenchange', handleFullscreenChange);

		return () => {
			if (fscreen.fullscreenEnabled)
				fscreen.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, []);

	const handleToggleFullscreen = () => {
		if (fscreen.fullscreenElement)
			fscreen.exitFullscreen();
		else
			fscreen.requestFullscreen(document.documentElement);
	};

	const handleFullscreenChange = () => setFullscreen(fscreen.fullscreenElement !== null);

	return (
		<>
			<FullscreenVideo />
			<WindowedVideo />
			<AudioPeers />
			<TopBar
				fullscreenEnabled={fscreen.fullscreenEnabled}
				fullscreen={isFullscreen}
				onFullscreen={handleToggleFullscreen}
			/>
			<ControlButtonsBar />
			<MainContent />
			<LobbyDialog />
			<Settings />
			<Help />
			<FilesharingDialog />
			<ExtraVideoDialog />
			<HelpContainer>
				<HelpButton type='iconbutton' />
			</HelpContainer>
		</>
	);
};

export default Room;
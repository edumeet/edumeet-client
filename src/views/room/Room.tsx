import { useEffect, useState } from 'react';
import fscreen from 'fscreen';
import MeetingDrawer from '../../components/meetingdrawer/MeetingDrawer';
import Democratic from '../../components/democratic/Democratic';
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
import PrivacyDialog from '../../components/privacydialog/PrivacyDialog';

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
			<MeetingDrawer />
			<ControlButtonsBar />
			<Democratic />
			<LobbyDialog />
			<Settings />
			<Help />
			<FilesharingDialog />
			<ExtraVideoDialog />
			<PrivacyDialog />
		</>
	);
};

export default Room;
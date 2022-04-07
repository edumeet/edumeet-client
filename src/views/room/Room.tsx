import { useEffect, useState } from 'react';
import fscreen from 'fscreen';
import Notifications from '../../components/notifications/Notifications';
import MeetingDrawer from '../../components/meetingdrawer/MeetingDrawer';
import Democratic from '../../components/democratic/Democratic';
import LockDialog from '../../components/lockdialog/LockDialog';
import Settings from '../../components/settingsdialog/SettingsDialog';
import TopBar from '../../components/topbar/TopBar';
import { useAppSelector } from '../../store/hooks';
import FullscreenVideo from '../../components/fullscreenvideo/FullscreenVideo';
import WindowedVideo from '../../components/windowedvideo/WindowedVideo';

const Room = (): JSX.Element => {
	const [ isFullscreen, setFullscreen ] = useState(false);
	const settings = useAppSelector((state) => state.settings);

	useEffect(() => {
		if (fscreen.fullscreenEnabled) {
			fscreen.addEventListener('fullscreenchange', handleFullscreenChange);
		}

		return () => {
			if (fscreen.fullscreenEnabled) {
				fscreen.removeEventListener('fullscreenchange', handleFullscreenChange);
			}
		};
	}, []);

	const handleToggleFullscreen = () => {
		if (fscreen.fullscreenElement) {
			fscreen.exitFullscreen();
		} else {
			fscreen.requestFullscreen(document.documentElement);
		}
	};

	const handleFullscreenChange = () => {
		setFullscreen(fscreen.fullscreenElement !== null);
	};

	return (
		<>
			<FullscreenVideo />
			<WindowedVideo />

			{ /*
				<AudioPeers />
			*/}

			{ settings.showNotifications &&
				<Notifications />
			}

			<TopBar
				fullscreenEnabled={fscreen.fullscreenEnabled}
				fullscreen={isFullscreen}
				onFullscreen={handleToggleFullscreen}
			/>
			<MeetingDrawer />
			<Democratic />
			<LockDialog />
			<Settings />
		</>
	);
};

export default Room;
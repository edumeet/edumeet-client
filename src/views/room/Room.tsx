import { useEffect, useState } from 'react';
import fscreen from 'fscreen';
import Settings from '../../components/settingsdialog/SettingsDialog';
import TopBar from '../../components/topbar/TopBar';
import FullscreenVideo from '../../components/fullscreenvideo/FullscreenVideo';
import WindowedVideo from '../../components/windowedvideo/WindowedVideo';
import AudioPeers from '../../components/audiopeers/AudioPeers';
import LobbyDialog from '../../components/lobbydialog/LobbyDialog';
import FilesharingDialog from '../../components/filesharingdialog/FilesharingDialog';
import ExtraVideoDialog from '../../components/extravideodialog/ExtraVideoDialog';
import Help from '../../components/helpdialog/HelpDialog';
import MainContent from '../../components/maincontent/MainContent';
import HelpButton from '../../components/controlbuttons/HelpButton';
import { useNotifier, useAppSelector, useAppDispatch } from '../../store/hooks';
import moment from 'moment';

import { countdownTimerActions as countdownTimerSlices } from '../../store/slices/countdownTimerSlice';

const Room = (): JSX.Element => {
	useNotifier();

	const [ isFullscreen, setFullscreen ] = useState(false);

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

	const remainingTime = useAppSelector((state) => state.countdownTimer.remainingTime);
	const isStarted = useAppSelector((state) => state.countdownTimer.isStarted);
	const dispatch = useAppDispatch();

	useEffect(() => {

		if (isStarted) {

			const _countdownTimerRef = setInterval(() => {
				let remainingTimeUnix = moment(`1000-01-01 ${remainingTime}`).unix();

				remainingTimeUnix--;

				const remainingTimeString = moment.unix(remainingTimeUnix).format('HH:mm:ss');

				dispatch(countdownTimerSlices.setCountdownTimerRemainingTime(remainingTimeString));

			}, 1000);
			
			return () => { clearInterval(_countdownTimerRef); };
		}

	}, [ isStarted, remainingTime, dispatch ]);

	return (
		<>
			<WindowedVideo />
			<AudioPeers />
			<TopBar
				fullscreenEnabled={fscreen.fullscreenEnabled}
				fullscreen={isFullscreen}
				onFullscreen={handleToggleFullscreen}
			/>
			<MainContent />
			<FullscreenVideo />
			<LobbyDialog />
			<Settings />
			<Help />
			<FilesharingDialog />
			<ExtraVideoDialog />
			<HelpButton type='iconbutton' />
		</>
	);
};

export default Room;
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

import * as countdownTimerActions from '../../store/actions/countdownTimerActions';
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

	const left = useAppSelector((state) => state.countdownTimer.left);
	const isRunning = useAppSelector((state) => state.countdownTimer.isRunning);
	const dispatch = useAppDispatch();

	useEffect(() => {

		// let _countdownTimerRef: NodeJS.Timeout | undefined = undefined;
		let _countdownTimerRef: NodeJS.Timeout | null = null;
				
		if (isRunning && !_countdownTimerRef) {

			_countdownTimerRef = setInterval(() => {
				let leftUnix = moment(`1000-01-01 ${left}`).unix();
				const endUnix = moment('1000-01-01 00:00:00').unix();

				leftUnix--;

				const leftString = moment.unix(leftUnix).format('HH:mm:ss');

				dispatch(countdownTimerSlices.setCountdownTimer({ left: leftString }));

				if (leftUnix === endUnix) {
					dispatch(countdownTimerActions.stopCountdownTimer());
				}

			}, 1000);
		} else if (_countdownTimerRef) clearInterval(_countdownTimerRef);

		return (): void => {
			if (_countdownTimerRef) {
				clearInterval(_countdownTimerRef);
				_countdownTimerRef = null;
			}
		};

	}, [ isRunning, left, dispatch ]);

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
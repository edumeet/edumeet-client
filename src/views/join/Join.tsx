import { useContext, useEffect, useState } from 'react';
import { Button } from '@mui/material';
import TextInputField from '../../components/textinputfield/TextInputField';
import { useAppDispatch, useAppSelector, useNotifier } from '../../store/hooks';
import { joinLabel, yourNameLabel } from '../../components/translated/translatedComponents';
import { AccountCircle } from '@mui/icons-material';
import MediaPreview from '../../components/mediapreview/MediaPreview';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';
import GenericDialog from '../../components/genericdialog/GenericDialog';
import { roomActions } from '../../store/slices/roomSlice';
import { settingsActions } from '../../store/slices/settingsSlice';
import { connect } from '../../store/actions/roomActions';
import PrecallTitle from '../../components/precalltitle/PrecallTitle';
import BlurBackgroundSwitch from '../../components/blurbackgroundswitch/BlurBackgroundSwitch';
import { isMobileSelector } from '../../store/selectors';
import { ChooserDiv } from '../../components/devicechooser/DeviceChooser';
import AudioOutputChooser from '../../components/devicechooser/AudioOutputChooser';
import { ServiceContext } from '../../store/store';
import { meActions } from '../../store/slices/meSlice';

interface JoinProps {
	roomId: string;
}

const Join = ({ roomId }: JoinProps): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);

	useNotifier();
	const dispatch = useAppDispatch();

	const { displayName } = useAppSelector((state) => state.settings);
	const joinInProgress = useAppSelector((state) => state.room.joinInProgress);
	const mediaLoading = useAppSelector((state) => state.media.videoInProgress || state.media.audioInProgress);
	const isMobile = useAppSelector(isMobileSelector);
	const deviceOs = useAppSelector((state) => state.me.browser.os);
	const showAudioChooser = useAppSelector((state) => state.media.previewAudioInputDeviceId && !state.media.audioMuted);
	const showVideoChooser = useAppSelector((state) => state.media.previewVideoDeviceId && !state.media.videoMuted);
	const { canSelectAudioOutput } = useAppSelector((state) => state.me);

	const [ name, setName ] = useState(displayName || '');

	const handleDisplayNameChange = (value: string) => {
		setName(value.trim() ? value : value.trim());
	};

	const handleJoin = () => {
		dispatch(settingsActions.setDisplayName(name));
		dispatch(connect(roomId));
	};

	useEffect(() => {
		const dn = new URL(window.location.href).searchParams.get('displayName');

		if (dn) {
			dispatch(settingsActions.setDisplayName(dn));
			setName(dn);
		}
	}, []);

	useEffect(() => {
		const headless = new URL(window.location.href).searchParams.get('headless');

		if (headless) {
			const myNewURL = window.location.href.split('?')[0];
			
			window.history.pushState({}, '', myNewURL);
			handleJoin();
		}
	}, []);

	useEffect(() => {
		dispatch(roomActions.updateRoom({ id: roomId }));
	}, []);

	// Used to unlock audio on ios.
	const unlockAudio = () => {
		const ctx = new AudioContext();

		mediaService.audioContext = ctx;
		dispatch(meActions.activateAudioContext());

		document.removeEventListener('touchend', unlockAudio);
	};

	// Listener for unlocking audio on ios.
	useEffect(() => {
		if (deviceOs === 'ios') 
			document.body.addEventListener('touchend', unlockAudio);

		return () => {
			if (deviceOs === 'ios')
				document.removeEventListener('touchend', unlockAudio);
		};
	}, []);

	return (
		<GenericDialog
			title={ <PrecallTitle /> }
			content={
				<>
					<MediaPreview />
					{showAudioChooser && <AudioInputChooser /> }
					{showVideoChooser && <VideoInputChooser /> }
					{showVideoChooser && !isMobile && <BlurBackgroundSwitch />}
					{canSelectAudioOutput && <AudioOutputChooser /> }
					<ChooserDiv>
						<TextInputField
							label={yourNameLabel()}
							value={name}
							setValue={handleDisplayNameChange}
							onEnter={handleJoin}
							startAdornment={<AccountCircle />}
							autoFocus
						/>
					</ChooserDiv>
				</>
			}
			actions={
				<Button
					onClick={handleJoin}
					variant='contained'
					disabled={!name || joinInProgress || mediaLoading }
					size='small'
				>
					{ joinLabel() }
				</Button>
			}
		/>
	);
};

export default Join;

import { useEffect } from 'react';
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
import { ChooserDiv } from '../../components/devicechooser/DeviceChooser';
import { BlurSwitch } from '../../components/settingsdialog/SettingsSwitches';
import { meActions } from '../../store/slices/meSlice';
import AudioOutputChooser from '../../components/devicechooser/AudioOutputChooser';
import { canSelectAudioOutput } from '../../store/selectors';
import TestAudioOutputButton from '../../components/audiooutputtest/AudioOutputTest';
import ImpressumButton from '../../components/controlbuttons/ImpressumButton';

interface JoinProps {
	roomId: string;
}

const Join = ({ roomId }: JoinProps): React.JSX.Element => {
	useNotifier();
	const dispatch = useAppDispatch();

	const displayName = useAppSelector((state) => state.settings.displayName);
	const joinInProgress = useAppSelector((state) => state.room.joinInProgress);
	const mediaLoading = useAppSelector((state) => state.me.videoInProgress || state.me.audioInProgress);
	const audioMuted = useAppSelector((state) => state.me.audioMuted);
	const videoMuted = useAppSelector((state) => state.me.videoMuted);
	const showAudioOutputChooser = useAppSelector(canSelectAudioOutput);
	
	const url = new URL(window.location.href);
	const headless = Boolean(url.searchParams.get('headless'));

	const handleDisplayNameChange = (value: string) => dispatch(settingsActions.setDisplayName(value.trim() ? value : value.trim()));

	const handleJoin = () => {
		dispatch(settingsActions.setDisplayName(displayName));
		dispatch(connect(roomId));
	};

	useEffect(() => {
		const dn = new URL(window.location.href).searchParams.get('displayName');

		if (dn) dispatch(settingsActions.setDisplayName(dn));

		if (headless) {
			dispatch(meActions.setAudioMuted(true));
			dispatch(meActions.setVideoMuted(true));
			dispatch(roomActions.setHeadless(true));
			dispatch(settingsActions.setHideSelfView(true));
			dispatch(settingsActions.setMaxActiveVideos(100));

			handleJoin();
		}
	}, []);

	return (
		<GenericDialog
			title={ <PrecallTitle /> }
			content={
				<>
					<MediaPreview startAudio={!audioMuted} startVideo={!videoMuted} stopAudio={false} stopVideo={false} updateSelection />
					<AudioInputChooser />
					{ showAudioOutputChooser && <AudioOutputChooser /> }
					<VideoInputChooser />
					<TestAudioOutputButton />
					<BlurSwitch />
					<ChooserDiv>
						<TextInputField
							label={yourNameLabel()}
							value={displayName}
							setValue={handleDisplayNameChange}
							onEnter={handleJoin}
							startAdornment={<AccountCircle />}
							autoFocus
						/>
					</ChooserDiv>
				</>
			}
			actions={
				<><ImpressumButton /><Button
					onClick={handleJoin}
					variant='contained'
					disabled={!displayName || joinInProgress || mediaLoading}
					size='small'
				>
					{joinLabel()}
				</Button></>
				
			}
		/>
	);
};

export default Join;

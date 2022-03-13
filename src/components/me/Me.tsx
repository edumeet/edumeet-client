import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAppSelector } from '../../store/hooks';
import { makePermissionSelector, meProducersSelector } from '../../store/selectors';
import { permissions } from '../../utils/roles';
import {
	activateAudioLabel,
	audioUnsupportedLabel,
	muteAudioLabel,
	screenSharingUnsupportedLabel,
	startScreenSharingLabel,
	startVideoLabel,
	stopScreenSharingLabel,
	stopVideoLabel,
	unmuteAudioLabel,
	videoUnsupportedLabel
} from '../translated/translatedComponents';
import VideoBox from '../videobox/VideoBox';

interface MeProps {
	advancedMode?: boolean;
	spacing: number;
	style: Record<'width' | 'height', number>
}

const Me = ({
	advancedMode,
	spacing,
	style
}: MeProps): JSX.Element => {
	const intl = useIntl();

	const canShareAudioSelector =
		useMemo(() => makePermissionSelector(permissions.SHARE_AUDIO), []);
	const canShareVideoSelector =
		useMemo(() => makePermissionSelector(permissions.SHARE_VIDEO), []);
	const canShareScreenSelector =
		useMemo(() => makePermissionSelector(permissions.SHARE_SCREEN), []);

	const hasAudioPermission = useAppSelector(canShareAudioSelector);
	const hasVideoPermission = useAppSelector(canShareVideoSelector);
	const hasScreenPermission = useAppSelector(canShareScreenSelector);

	const {
		micProducer,
		webcamProducer,
		screenProducer,
		extraVideoProducers
	} = useAppSelector(meProducersSelector);

	const {
		canSendMic,
		canSendWebcam,
		canShareScreen
	} = useAppSelector((state) => state.me);

	const activeSpeaker =
		useAppSelector((state) => state.me.id === state.room.activeSpeakerId);

	const [ hover, setHover ] = useState(false);

	const videoVisible = webcamProducer && !webcamProducer?.paused;
	const screenVisible = screenProducer && !screenProducer?.paused;

	let micState, micTip;

	if (!canSendMic || !hasAudioPermission) {
		micState = 'unsupported';
		micTip = audioUnsupportedLabel(intl);
	} else if (!micProducer) {
		micState = 'off';
		micTip = activateAudioLabel(intl);
	} else if (!micProducer.paused) {
		micState = 'on';
		micTip = muteAudioLabel(intl);
	} else {
		micState = 'muted';
		micTip = unmuteAudioLabel(intl);
	}

	let webcamState, webcamTip;

	if (!canSendWebcam || !hasVideoPermission) {
		webcamState = 'unsupported';
		webcamTip = videoUnsupportedLabel(intl);
	} else if (webcamProducer) {
		webcamState = 'on';
		webcamTip = stopVideoLabel(intl);
	} else {
		webcamState = 'off';
		webcamTip = startVideoLabel(intl);
	}

	let screenState, screenTip;

	if (!canShareScreen || !hasScreenPermission) {
		screenState = 'unsupported';
		screenTip = screenSharingUnsupportedLabel(intl);
	} else if (screenProducer) {
		screenState = 'on';
		screenTip = stopScreenSharingLabel(intl);
	} else {
		screenState = 'off';
		screenTip = startScreenSharingLabel(intl);
	}

	return (
		<>
			<VideoBox
				activeSpeaker={activeSpeaker}
				order={1}
				margin={spacing}
			>
				<div />
			</VideoBox>
		</>
	);
};

export default Me;
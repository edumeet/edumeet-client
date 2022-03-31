import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { makePermissionSelector, webcamProducerSelector } from '../../store/selectors';
import { producersActions } from '../../store/slices/producersSlice';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import {
	videoUnsupportedLabel,
	stopVideoLabel,
	startVideoLabel
} from '../translated/translatedComponents';
import VideoIcon from '@mui/icons-material/Videocam';
import VideoOffIcon from '@mui/icons-material/VideocamOff';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { deviceActions } from '../../store/slices/deviceSlice';

const WebcamButton = (props: ControlButtonProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();

	const canShareVideoSelector =
		useMemo(() => makePermissionSelector(permissions.SHARE_VIDEO), []);

	const hasVideoPermission = useAppSelector(canShareVideoSelector);
	const webcamProducer = useAppSelector(webcamProducerSelector);

	const {
		canSendWebcam,
		webcamInProgress,
	} = useAppSelector((state) => state.me);

	let webcamState: MediaState, webcamTip;

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

	return (
		<ControlButton
			toolTip={webcamTip}
			onClick={() => {
				if (webcamState === 'unsupported') return;

				if (webcamState === 'off') {
					dispatch(deviceActions.updateWebcam({
						start: true
					}));
				} else if (webcamProducer) {
					dispatch(
						producersActions.closeProducer({
							producerId: webcamProducer.id,
							local: true
						})
					);
				} else {
					// Shouldn't happen
				}
			}}
			disabled={webcamState === 'unsupported' || webcamInProgress}
			on={webcamState === 'on'}
			{ ...props }
		>
			{ webcamState === 'on' ? <VideoIcon /> : <VideoOffIcon /> }
		</ControlButton>
	);
};

export default WebcamButton;
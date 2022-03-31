import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { updateMic } from '../../store/actions/mediaActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { makePermissionSelector, micProducerSelector } from '../../store/selectors';
import { producersActions } from '../../store/slices/producersSlice';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import {
	audioUnsupportedLabel,
	activateAudioLabel,
	muteAudioLabel,
	unmuteAudioLabel
} from '../translated/translatedComponents';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ControlButton, { ControlButtonProps } from './ControlButton';

const MicButton = (props: ControlButtonProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();

	const canShareAudioSelector =
		useMemo(() => makePermissionSelector(permissions.SHARE_AUDIO), []);

	const hasAudioPermission = useAppSelector(canShareAudioSelector);
	const micProducer = useAppSelector(micProducerSelector);

	const {
		canSendMic,
		audioInProgress,
	} = useAppSelector((state) => state.me);

	let micState: MediaState, micTip;

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

	return (
		<ControlButton
			toolTip={micTip}
			onClick={() => {
				if (micState === 'unsupported') return;

				if (micState === 'off') {
					dispatch(updateMic({
						start: true
					}));
				} else if (micProducer) {
					if (micState === 'on') {
						dispatch(
							producersActions.setProducerPaused({
								producerId: micProducer.id,
								local: true
							})
						);
					} else if (micState === 'muted') {
						dispatch(
							producersActions.setProducerResumed({
								producerId: micProducer.id,
								local: true
							})
						);
					}
				} else {
					// Shouldn't happen
				}
			}}
			disabled={micState === 'unsupported' || audioInProgress}
			on={micState === 'on'}
			{ ...props }
		>
			{ micState === 'on' ? <MicIcon /> : <MicOffIcon /> }
		</ControlButton>
	);
};

export default MicButton;
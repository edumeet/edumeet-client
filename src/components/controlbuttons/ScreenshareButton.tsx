import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { updateScreen } from '../../store/actions/mediaActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { makePermissionSelector, screenProducerSelector } from '../../store/selectors';
import { producersActions } from '../../store/slices/producersSlice';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import {
	screenSharingUnsupportedLabel,
	startScreenSharingLabel,
	stopScreenSharingLabel,
} from '../translated/translatedComponents';
import ScreenIcon from '@mui/icons-material/ScreenShare';
import ScreenOffIcon from '@mui/icons-material/StopScreenShare';
import ControlButton from './ControlButton';

interface ScreenshareButtonProps {
	size?: 'small' | 'medium' | 'large';
}

const ScreenshareButton = ({
	size = 'large',
}: ScreenshareButtonProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();

	const canShareScreenSelector =
		useMemo(() => makePermissionSelector(permissions.SHARE_SCREEN), []);

	const hasScreenPermission = useAppSelector(canShareScreenSelector);
	const screenProducer = useAppSelector(screenProducerSelector);

	const {
		canShareScreen,
		screenShareInProgress
	} = useAppSelector((state) => state.me);

	let screenState: MediaState, screenTip;

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
		<ControlButton
			toolTip={screenTip}
			size={size}
			onClick={() => {
				if (screenState === 'unsupported') return;

				if (screenState === 'off') {
					dispatch(updateScreen({
						start: true
					}));
				} else if (screenProducer) {
					dispatch(
						producersActions.closeProducer({
							producerId: screenProducer.id,
							local: true
						})
					);
				} else {
					// Shouldn't happen
				}
			}}
			disabled={screenState === 'unsupported' || screenShareInProgress}
		>
			{ screenState === 'on' ? <ScreenIcon /> : <ScreenOffIcon /> }
		</ControlButton>
	);
};

export default ScreenshareButton;
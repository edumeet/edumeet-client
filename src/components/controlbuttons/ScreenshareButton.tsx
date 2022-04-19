import { useIntl } from 'react-intl';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { screenProducerSelector } from '../../store/selectors';
import { producersActions } from '../../store/slices/producersSlice';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import {
	screenSharingUnsupportedLabel,
	startScreenSharingLabel,
	stopScreenSharingLabel,
} from '../translated/translatedComponents';
import ScreenIcon from '@mui/icons-material/ScreenShare';
import CancelIcon from '@mui/icons-material/Cancel';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { updateScreenSharing } from '../../store/actions/mediaActions';

const ScreenshareButton = (props: ControlButtonProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();
	const hasScreenPermission = usePermissionSelector(permissions.SHARE_SCREEN);
	const screenProducer = useAppSelector(screenProducerSelector);

	const {
		canShareScreen,
		screenSharingInProgress
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
			onClick={() => {
				if (screenState === 'unsupported') return;

				if (screenState === 'off') {
					dispatch(updateScreenSharing({
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
			disabled={screenState === 'unsupported' || screenSharingInProgress}
			on={screenState === 'on'}
			{ ...props }
		>
			{ screenState === 'on' ? <CancelIcon /> : <ScreenIcon /> }
		</ControlButton>
	);
};

export default ScreenshareButton;
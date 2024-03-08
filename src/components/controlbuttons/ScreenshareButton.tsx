import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { permissions } from '../../utils/roles';
import { MediaState } from '../../utils/types';
import {
	screenSharingUnsupportedLabel,
	startScreenSharingLabel,
	stopScreenSharingLabel,
} from '../translated/translatedComponents';
import ScreenIcon from '@mui/icons-material/ScreenShare';
import StopScreenIcon from '@mui/icons-material/StopScreenShare';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { stopScreenSharing, updateScreenSharing } from '../../store/actions/mediaActions';

const ScreenshareButton = (props: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasScreenPermission = usePermissionSelector(permissions.SHARE_SCREEN);
	const screenEnabled = useAppSelector((state) => state.me.screenEnabled);
	const { canShareScreen, screenSharingInProgress } = useAppSelector((state) => state.me);

	let screenState: MediaState, screenTip;

	if (!canShareScreen || !hasScreenPermission) {
		screenState = 'unsupported';
		screenTip = screenSharingUnsupportedLabel();
	} else if (screenEnabled) {
		screenState = 'on';
		screenTip = stopScreenSharingLabel();
	} else {
		screenState = 'off';
		screenTip = startScreenSharingLabel();
	}

	return (
		<ControlButton
			toolTip={screenTip}
			onClick={() => {
				if (screenState === 'unsupported') return;

				if (screenState === 'off') {
					dispatch(updateScreenSharing());
				} else {
					dispatch(stopScreenSharing());
				}
			}}
			disabled={screenState === 'unsupported' || screenSharingInProgress}
			on={screenState === 'on'}
			{ ...props }
		>
			{ screenState === 'on' ? <StopScreenIcon /> : <ScreenIcon /> }
		</ControlButton>
	);
};

export default ScreenshareButton;

import {
	useAppDispatch,
	useAppSelector
} from '../../store/hooks';
import SettingsIcon from '@mui/icons-material/Settings';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	showSettingsLabel,
} from '../translated/translatedComponents';
import { uiActions } from '../../store/slices/uiSlice';
import { updatePreviewMic, updatePreviewWebcam } from '../../store/actions/mediaActions';

const SettingsButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const settingsOpen = useAppSelector((state) => state.ui.settingsOpen);

	return (
		<ControlButton
			toolTip={showSettingsLabel()}
			onClick={() => {
				dispatch(updatePreviewMic());
				dispatch(updatePreviewWebcam());
				dispatch(uiActions.setUi({ settingsOpen: !settingsOpen }));
			}}
			{ ...props }
		>
			<SettingsIcon />
		</ControlButton>
	);
};

export default SettingsButton;
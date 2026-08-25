import PersonalVideoOffIcon from '@mui/icons-material/PersonalVideoOutlined';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { meActions } from '../../store/slices/meSlice';
import { startReceivingVideoLabel } from '../translated/translatedComponents';
import ControlButton from './ControlButton';

/**
 * Top bar indicator that only appears while the user has turned off receiving
 * the other participants' webcams. Without it that state is invisible once the
 * participant list is closed, and an empty video grid looks like a bug rather
 * than a choice. Clicking it starts receiving video again.
 */
const ReceiveVideoIndicator = (): React.JSX.Element | null => {
	const dispatch = useAppDispatch();
	const receiveVideo = useAppSelector((state) => state.me.receiveVideo);

	if (receiveVideo) return null;

	return (
		<ControlButton
			type='iconbutton'
			toolTip={startReceivingVideoLabel()}
			onClick={() => dispatch(meActions.setReceiveVideo(true))}
		>
			<PersonalVideoOffIcon />
		</ControlButton>
	);
};

export default ReceiveVideoIndicator;

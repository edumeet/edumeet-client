// Outlined rather than the filled VideocamOff, which WebcamButton already uses
// for your own camera being off. Same crossed out camera, distinct weight, so
// the two meanings do not read as the same indicator.
import VideoOffIcon from '@mui/icons-material/VideocamOffOutlined';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { meActions } from '../../store/slices/meSlice';
import { receivingVideoStoppedLabel } from '../translated/translatedComponents';
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
			toolTip={receivingVideoStoppedLabel()}
			onClick={() => dispatch(meActions.setReceiveVideo(true))}
		>
			<VideoOffIcon />
		</ControlButton>
	);
};

export default ReceiveVideoIndicator;

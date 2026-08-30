import VideoOffIcon from '@mui/icons-material/VideocamOffOutlined';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { meActions } from '../../store/slices/meSlice';
import { receivingVideoStoppedLabel } from '../translated/translatedComponents';
import ControlButton from './ControlButton';

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

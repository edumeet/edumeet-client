import { NoMeetingRoom, NoMeetingRoomOutlined } from '@mui/icons-material';
import { setEscapeMeeting } from '../../store/actions/meActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { escapeMeetingLabel } from '../translated/translatedComponents';
import ControlButton, { ControlButtonProps } from './ControlButton';

const EscapeMeetingButton = ({
	size,
	...props
} : ControlButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const {
		escapeMeeting,
		escapeMeetingInProgress
	} = useAppSelector((state) => state.me);

	return (
		<ControlButton
			toolTip={ escapeMeetingLabel() }
			onClick={ () => {
				dispatch(setEscapeMeeting(!escapeMeeting));
			} }
			disabled={ escapeMeetingInProgress }
			size={ size }
			{ ...props }
		>
			{ escapeMeeting ? <NoMeetingRoom fontSize={size} /> : <NoMeetingRoomOutlined fontSize={size} /> }
		</ControlButton>
	);
};

export default EscapeMeetingButton;
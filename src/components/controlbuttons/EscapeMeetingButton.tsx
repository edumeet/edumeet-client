import { NoMeetingRoom, NoMeetingRoomOutlined } from '@mui/icons-material';
import { setEscapeMeeting } from '../../store/actions/meActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { EscapeMeetingLabel } from '../translated/translatedComponents';
import ControlButton, { ControlButtonProps } from './ControlButton';

const EscapeMeetingButton = (
	props
: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const {
		escapeMeeting,
		escapeMeetingInProgress
	} = useAppSelector((state) => state.me);

	return (
		<ControlButton
			toolTip={ EscapeMeetingLabel() }
			onClick={ () => {
				dispatch(setEscapeMeeting(!escapeMeeting));
			} }
			disabled={ escapeMeetingInProgress }
			{ ...props }
		>
			{ escapeMeeting ? <NoMeetingRoom /> : <NoMeetingRoomOutlined /> }
		</ControlButton>
	);
};

export default EscapeMeetingButton;
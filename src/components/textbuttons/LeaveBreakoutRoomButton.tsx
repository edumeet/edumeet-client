import { styled } from '@mui/material';
import { Button } from '@mui/material';
import { leaveBreakoutRoomLabel } from '../translated/translatedComponents';
import { leaveBreakoutRoom } from '../../store/actions/roomActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

const StyledLeaveBreakoutRoomButton = styled(Button)(({ theme }) => ({
	marginRight: theme.spacing(1),
	marginLeft: theme.spacing(1),
	marginTop: 0,
	marginBottom: 0,
	paddingTop: 0,
	paddingBottom: 0,
}));

const LeaveBreakoutRoomButton = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const changeRoomInProgress = useAppSelector((state) => state.room.transitBreakoutRoomInProgress);

	return (
		<StyledLeaveBreakoutRoomButton
			aria-label={leaveBreakoutRoomLabel()}
			disabled={changeRoomInProgress}
			color='primary'
			variant='contained'
			size='small'
			onClick={(e) => {
				e.stopPropagation();

				dispatch(leaveBreakoutRoom());
			}}
		>
			{ leaveBreakoutRoomLabel() }
		</StyledLeaveBreakoutRoomButton>
	);
};

export default LeaveBreakoutRoomButton;
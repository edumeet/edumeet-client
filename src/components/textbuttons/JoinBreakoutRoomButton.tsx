import { styled } from '@mui/material';
import { Button } from '@mui/material';
import { joinBreakoutRoomLabel } from '../translated/translatedComponents';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { joinBreakoutRoom } from '../../store/actions/roomActions';

interface JoinBreakoutRoomButtonProps {
	sessionId: string;
}

const StyledJoinBreakoutRoomButton = styled(Button)(({ theme }) => ({
	marginRight: theme.spacing(1),
	marginLeft: theme.spacing(1),
	marginTop: 0,
	marginBottom: 0,
	paddingTop: 0,
	paddingBottom: 0,
}));

const JoinBreakoutRoomButton = ({
	sessionId,
}: JoinBreakoutRoomButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const changeRoomInProgress = useAppSelector((state) => state.room.transitBreakoutRoomInProgress);

	return (
		<StyledJoinBreakoutRoomButton
			aria-label={joinBreakoutRoomLabel()}
			disabled={changeRoomInProgress}
			color='primary'
			variant='contained'
			size='small'
			onClick={(e) => {
				e.stopPropagation();

				dispatch(joinBreakoutRoom(sessionId));
			}}
		>
			{ joinBreakoutRoomLabel() }
		</StyledJoinBreakoutRoomButton>
	);
};

export default JoinBreakoutRoomButton;
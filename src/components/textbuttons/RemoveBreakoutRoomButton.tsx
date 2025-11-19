import { Button } from '@mui/material';
import { removeBreakoutRoomLabel } from '../translated/translatedComponents';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeBreakoutRoom } from '../../store/actions/roomActions';

interface RemoveBreakoutRoomButtonProps {
	sessionId: string;
}

const RemoveBreakoutRoomButton = ({
	sessionId
}: RemoveBreakoutRoomButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const updateBreakoutInProgress = useAppSelector((state) => state.room.updateBreakoutInProgress);

	return (
		<Button
			aria-label={removeBreakoutRoomLabel()}
			disabled={updateBreakoutInProgress}
			color='error'
			variant='contained'
			size='small'
			onClick={() => dispatch(removeBreakoutRoom(sessionId))}
		>
			{ removeBreakoutRoomLabel() }
		</Button>
	);
};

export default RemoveBreakoutRoomButton;
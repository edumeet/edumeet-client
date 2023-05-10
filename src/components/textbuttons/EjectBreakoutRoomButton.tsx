import { Button } from '@mui/material';
import { closeBreakoutRoomLabel } from '../translated/translatedComponents';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { ejectBreakoutRoom } from '../../store/actions/roomActions';

interface EjectBreakoutRoomButtonProps {
	sessionId: string;
}

const EjectBreakoutRoomButton = ({
	sessionId
}: EjectBreakoutRoomButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const updateBreakoutInProgress = useAppSelector((state) => state.room.updateBreakoutInProgress);

	return (
		<Button
			aria-label={closeBreakoutRoomLabel()}
			disabled={updateBreakoutInProgress}
			color='error'
			variant='contained'
			size='small'
			onClick={() => dispatch(ejectBreakoutRoom(sessionId))}
		>
			{ closeBreakoutRoomLabel() }
		</Button>
	);
};

export default EjectBreakoutRoomButton;
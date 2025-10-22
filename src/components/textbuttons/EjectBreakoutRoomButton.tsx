import { Button } from '@mui/material';
import { clearOutBreakoutRoomLabel } from '../translated/translatedComponents';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { ejectBreakoutRoom } from '../../store/actions/roomActions';

interface EjectBreakoutRoomButtonProps {
	sessionId: string;
}

const EjectBreakoutRoomButton = ({
	sessionId
}: EjectBreakoutRoomButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const updateBreakoutInProgress = useAppSelector((state) => state.room.updateBreakoutInProgress);

	return (
		<Button
			aria-label={clearOutBreakoutRoomLabel()}
			disabled={updateBreakoutInProgress}
			color='error'
			variant='contained'
			size='small'
			onClick={() => dispatch(ejectBreakoutRoom(sessionId))}
		>
			{ clearOutBreakoutRoomLabel() }
		</Button>
	);
};

export default EjectBreakoutRoomButton;
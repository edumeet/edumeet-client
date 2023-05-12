import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeBreakoutRoomLabel } from '../translated/translatedComponents';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { removeBreakoutRoom } from '../../store/actions/roomActions';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

interface RemoveBreakoutRoomButtonProps extends ControlButtonProps {
	sessionId: string;
}

const RemoveBreakoutRoomButton = ({
	sessionId,
	...props
}: RemoveBreakoutRoomButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const createRoomInProgress = useAppSelector((state) => state.room.updateBreakoutInProgress);

	return (
		<ControlButton
			toolTip={ removeBreakoutRoomLabel() }
			onClick={() => dispatch(removeBreakoutRoom(sessionId))}
			disabled={ createRoomInProgress }
			{ ...props }
		>
			<DeleteForeverIcon />
		</ControlButton>
	);
};

export default RemoveBreakoutRoomButton;
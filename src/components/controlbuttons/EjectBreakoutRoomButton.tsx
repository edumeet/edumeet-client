import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearOutBreakoutRoomLabel } from '../translated/translatedComponents';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { ejectBreakoutRoom } from '../../store/actions/roomActions';
import EjectIcon from '@mui/icons-material/Eject';

interface EjectBreakoutRoomButtonProps extends ControlButtonProps {
	sessionId: string;
}

const EjectBreakoutRoomButton = ({
	sessionId,
	...props
}: EjectBreakoutRoomButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const createRoomInProgress = useAppSelector((state) => state.room.updateBreakoutInProgress);

	return (
		<ControlButton
			toolTip={ clearOutBreakoutRoomLabel() }
			onClick={() => dispatch(ejectBreakoutRoom(sessionId))}
			disabled={ createRoomInProgress }
			{ ...props }
		>
			<EjectIcon />
		</ControlButton>
	);
};

export default EjectBreakoutRoomButton;
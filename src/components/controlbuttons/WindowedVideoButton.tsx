import { useAppDispatch, useAppSelector } from '../../store/hooks';
import NewWindowIcon from '@mui/icons-material/OpenInNew';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { roomActions } from '../../store/slices/roomSlice';
import { newWindowLabel } from '../translated/translatedComponents';

interface WindowedVideoButtonProps extends ControlButtonProps {
	consumerId: string;
}

const WindowedVideoButton = ({
	consumerId,
	...props
}: WindowedVideoButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const windowedConsumers =
		useAppSelector((state) => state.room.windowedConsumers);

	const isWindowed = windowedConsumers.includes(consumerId);

	return (
		<ControlButton
			toolTip={newWindowLabel()}
			onClick={() => {
				if (isWindowed) {
					dispatch(roomActions.removeWindowedConsumer(consumerId));
				} else {
					dispatch(roomActions.addWindowedConsumer(consumerId));
				}
			}}
			on={!isWindowed}
			disabled={isWindowed}
			{ ...props }
		>
			<NewWindowIcon />
		</ControlButton>
	);
};

export default WindowedVideoButton;
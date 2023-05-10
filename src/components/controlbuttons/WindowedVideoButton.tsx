import { useAppDispatch, useAppSelector } from '../../store/hooks';
import NewWindowIcon from '@mui/icons-material/OpenInNew';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { newWindowLabel } from '../translated/translatedComponents';
import { windowedConsumersSelector } from '../../store/selectors';
import { roomSessionsActions } from '../../store/slices/roomSessionsSlice';

interface WindowedVideoButtonProps extends ControlButtonProps {
	consumerId: string;
}

const WindowedVideoButton = ({
	consumerId,
	...props
}: WindowedVideoButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const windowedConsumers = useAppSelector(windowedConsumersSelector);
	const sessionId = useAppSelector((state) => state.me.sessionId);

	const isWindowed = Boolean(windowedConsumers.find((c) => c.id === consumerId));

	return (
		<ControlButton
			toolTip={newWindowLabel()}
			onClick={() => {
				if (isWindowed) {
					dispatch(roomSessionsActions.removeWindowedConsumer({ sessionId, consumerId }));
				} else {
					dispatch(roomSessionsActions.addWindowedConsumer({ sessionId, consumerId }));
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
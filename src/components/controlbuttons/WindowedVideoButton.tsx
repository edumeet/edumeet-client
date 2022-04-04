import { useIntl } from 'react-intl';
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
	const intl = useIntl();
	const dispatch = useAppDispatch();
	const windowedConsumer =
		useAppSelector((state) => state.room.windowedConsumer);

	return (
		<ControlButton
			toolTip={newWindowLabel(intl)}
			onClick={() => {
				if (consumerId === windowedConsumer) {
					dispatch(roomActions.setWindowedConsumer());
				} else {
					dispatch(roomActions.setWindowedConsumer(consumerId));
				}
			}}
			on={consumerId !== windowedConsumer}
			disabled={consumerId === windowedConsumer}
			{ ...props }
		>
			<NewWindowIcon />
		</ControlButton>
	);
};

export default WindowedVideoButton;
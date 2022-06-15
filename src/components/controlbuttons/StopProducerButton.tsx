import {
	useAppDispatch,
} from '../../store/hooks';
import { producersActions } from '../../store/slices/producersSlice';
import {
	stopVideoLabel,
} from '../translated/translatedComponents';
import CancelIcon from '@mui/icons-material/Cancel';
import ControlButton, { ControlButtonProps } from './ControlButton';

interface ExtraVideoButtonProps extends ControlButtonProps {
	producerId: string;
}

const StopProducerButton = ({
	producerId,
	...props
}: ExtraVideoButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();

	return (
		<ControlButton
			toolTip={stopVideoLabel()}
			onClick={() => {
				dispatch(
					producersActions.closeProducer({
						producerId: producerId,
						local: true
					})
				);
			}}
			{ ...props }
		>
			<CancelIcon />
		</ControlButton>
	);
};

export default StopProducerButton;
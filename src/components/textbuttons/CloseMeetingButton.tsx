import { ButtonProps } from '@mui/material';
import { closeMeeting } from '../../store/actions/roomActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	closeMeetingConfirmLabel,
	closeMeetingLabel,
} from '../translated/translatedComponents';
import ConfirmButton from './ConfirmButton';

interface CloseMeetingButtonProps extends Pick<ButtonProps, 'size'> {
	label?: string;
	beforeClose?: () => Promise<boolean>;
}

const CloseMeetingButton = ({ size, label, beforeClose }: CloseMeetingButtonProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const closeMeetingInProgress =
		useAppSelector((state) => state.room.closeMeetingInProgress);

	const handleConfirm = async (): Promise<void> => {
		if (beforeClose && !(await beforeClose())) return;

		dispatch(closeMeeting());
	};

	return (
		<ConfirmButton
			label={label ?? closeMeetingLabel()}
			confirmContent={closeMeetingConfirmLabel()}
			disabled={closeMeetingInProgress}
			onConfirm={handleConfirm}
			size={size}
		/>
	);
};

export default CloseMeetingButton;

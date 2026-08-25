import { ButtonProps } from '@mui/material';
import { closeMeeting } from '../../store/actions/roomActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	closeMeetingConfirmLabel,
	closeMeetingLabel,
} from '../translated/translatedComponents';
import ConfirmButton from './ConfirmButton';

const CloseMeetingButton = ({ size }: Pick<ButtonProps, 'size'>): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const closeMeetingInProgress =
		useAppSelector((state) => state.room.closeMeetingInProgress);

	return (
		<ConfirmButton
			label={closeMeetingLabel()}
			confirmContent={closeMeetingConfirmLabel()}
			disabled={closeMeetingInProgress}
			onConfirm={() => dispatch(closeMeeting())}
			size={size}
		/>
	);
};

export default CloseMeetingButton;

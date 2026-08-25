import { ButtonProps } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	stopAllVideoConfirmLabel,
	stopAllVideoLabel,
} from '../translated/translatedComponents';
import { stopAllVideo } from '../../store/actions/peerActions';
import ConfirmButton from './ConfirmButton';

const StopAllVideoButton = ({ size }: Pick<ButtonProps, 'size'> = {}): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const stopAllVideoInProgress = useAppSelector((state) => state.room.stopAllVideoInProgress);

	return (
		<ConfirmButton
			label={stopAllVideoLabel()}
			confirmContent={stopAllVideoConfirmLabel()}
			disabled={stopAllVideoInProgress}
			onConfirm={() => dispatch(stopAllVideo())}
			size={size}
		/>
	);
};

export default StopAllVideoButton;

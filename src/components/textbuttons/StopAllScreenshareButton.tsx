import { ButtonProps } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	stopAllScreensharingConfirmLabel,
	stopAllScreensharingLabel,
} from '../translated/translatedComponents';
import { stopAllScreenshare } from '../../store/actions/peerActions';
import ConfirmButton from './ConfirmButton';

const StopAllScreenshareButton = ({ size }: Pick<ButtonProps, 'size'> = {}): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const stopAllScreenshareInProgress =
		useAppSelector((state) => state.room.stopAllScreenshareInProgress);

	return (
		<ConfirmButton
			label={stopAllScreensharingLabel()}
			confirmContent={stopAllScreensharingConfirmLabel()}
			disabled={stopAllScreenshareInProgress}
			onConfirm={() => dispatch(stopAllScreenshare())}
			size={size}
		/>
	);
};

export default StopAllScreenshareButton;

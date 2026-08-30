import { ButtonProps } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	muteAllConfirmLabel,
	muteAllLabel,
} from '../translated/translatedComponents';
import { muteAll } from '../../store/actions/peerActions';
import ConfirmButton from './ConfirmButton';

const MuteAllButton = ({ size }: Pick<ButtonProps, 'size'> = {}): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const muteAllInProgress = useAppSelector((state) => state.room.muteAllInProgress);

	return (
		<ConfirmButton
			label={muteAllLabel()}
			confirmContent={muteAllConfirmLabel()}
			disabled={muteAllInProgress}
			onConfirm={() => dispatch(muteAll())}
			size={size}
		/>
	);
};

export default MuteAllButton;

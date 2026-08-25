import { Button, ButtonProps } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	startReceivingVideoLabel,
	stopReceivingVideoLabel,
} from '../translated/translatedComponents';
import { meActions } from '../../store/slices/meSlice';

const ReceiveVideoButton = ({ size }: Pick<ButtonProps, 'size'> = {}): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const receiveVideo = useAppSelector((state) => state.me.receiveVideo);
	const label = receiveVideo ? stopReceivingVideoLabel() : startReceivingVideoLabel();

	return (
		<Button
			aria-label={label}
			color='primary'
			variant='contained'
			onClick={() => dispatch(meActions.setReceiveVideo(!receiveVideo))}
			size={size}
		>
			{ label }
		</Button>
	);
};

export default ReceiveVideoButton;

import { Button, ButtonProps } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	startReceivingVideoLabel,
	stopReceivingVideoLabel,
} from '../translated/translatedComponents';
import { meActions } from '../../store/slices/meSlice';

/**
 * Stops or resumes receiving the other participants' webcams, to save
 * downstream bandwidth. This is a local choice only: nobody else can tell,
 * and unlike the moderator actions next to it in the participant list it
 * changes nothing for anyone else. Screen shares and extra video keep
 * arriving either way.
 */
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

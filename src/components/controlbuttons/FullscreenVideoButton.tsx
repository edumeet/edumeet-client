import { useIntl } from 'react-intl';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { roomActions } from '../../store/slices/roomSlice';
import { enterFullscreenLabel, leaveFullscreenLabel } from '../translated/translatedComponents';

interface FullscreenVideoButtonProps extends ControlButtonProps {
	consumerId: string;
}

const FullscreenVideoButton = ({
	consumerId,
	...props
}: FullscreenVideoButtonProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();
	const fullscreenConsumer =
		useAppSelector((state) => state.room.fullscreenConsumer);

	return (
		<ControlButton
			toolTip={
				consumerId === fullscreenConsumer ?
					leaveFullscreenLabel(intl) :
					enterFullscreenLabel(intl)
			}
			onClick={() => {
				if (consumerId === fullscreenConsumer) {
					dispatch(roomActions.setFullscreenConsumer());
				} else {
					dispatch(roomActions.setFullscreenConsumer(consumerId));
				}
			}}
			on={consumerId !== fullscreenConsumer}
			{ ...props }
		>
			{ consumerId !== fullscreenConsumer ? <FullscreenIcon /> : <FullscreenExitIcon /> }
		</ControlButton>
	);
};

export default FullscreenVideoButton;
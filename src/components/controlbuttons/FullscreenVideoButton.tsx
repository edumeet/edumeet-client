import { useAppDispatch, useAppSelector } from '../../store/hooks';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { enterFullscreenLabel, leaveFullscreenLabel } from '../translated/translatedComponents';
import { fullscreenConsumerSelector } from '../../store/selectors';
import { roomSessionsActions } from '../../store/slices/roomSessionsSlice';

/* import { uiActions } from '../../store/slices/uiSlice'; */

interface FullscreenVideoButtonProps extends ControlButtonProps {
	consumerId: string;
}

const FullscreenVideoButton = ({
	consumerId,
	...props
}: FullscreenVideoButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const fullscreenConsumer = useAppSelector(fullscreenConsumerSelector);
	const sessionId = useAppSelector((state) => state.me.sessionId);

	return (
		<ControlButton
			toolTip={
				consumerId === fullscreenConsumer?.id ?
					leaveFullscreenLabel() :
					enterFullscreenLabel()
			}
			onClick={() => {
				if (consumerId === fullscreenConsumer?.id) {
					dispatch(roomSessionsActions.setFullscreenConsumer({ sessionId, consumerId: undefined }));
				} else {
					dispatch(roomSessionsActions.setFullscreenConsumer({ sessionId, consumerId }));

					/* dispatch(uiActions.setUi({ participantListOpen: false }));
					dispatch(uiActions.setUi({ chatOpen: false })); */

				}
			}}
			on={consumerId !== fullscreenConsumer?.id}
			{ ...props }
		>
			{ consumerId !== fullscreenConsumer?.id ? <FullscreenIcon /> : <FullscreenExitIcon /> }
		</ControlButton>
	);
};

export default FullscreenVideoButton;
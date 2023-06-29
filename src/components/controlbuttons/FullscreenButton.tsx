import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	enterFullscreenLabel,
	leaveFullscreenLabel,
} from '../translated/translatedComponents';

interface FullscreenButtonProps extends ControlButtonProps {
	fullscreen?: boolean;
}

const FullscreenButton = ({
	fullscreen,
	...props
}: FullscreenButtonProps): JSX.Element => {
	return (
		<ControlButton
			toolTip={fullscreen ?
				leaveFullscreenLabel() : enterFullscreenLabel()}
			{ ...props }
		>
			{ fullscreen ?
				<FullscreenExitIcon />
				:
				<FullscreenIcon />
			}
		</ControlButton>
	);
};

export default FullscreenButton;
import {
	usePermissionSelector
} from '../../store/hooks';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ControlButton, { ControlButtonProps } from './ControlButton';
import {
	enterFullscreenLabel,
	leaveFullscreenLabel,
} from '../translated/translatedComponents';
import { permissions } from '../../utils/roles';

interface FullscreenButtonProps extends ControlButtonProps {
	fullscreen?: boolean;
}

const FullscreenButton = ({
	fullscreen,
	...props
}: FullscreenButtonProps): JSX.Element => {
	const canPromote = usePermissionSelector(permissions.PROMOTE_PEER);

	return (
		<ControlButton
			toolTip={fullscreen ?
				leaveFullscreenLabel() : enterFullscreenLabel()}
			disabled={!canPromote}
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
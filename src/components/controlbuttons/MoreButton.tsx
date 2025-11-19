import MoreIcon from '@mui/icons-material/MoreVert';
import ControlButton, { ControlButtonProps } from './ControlButton';
import PulsingBadge from '../pulsingbadge/PulsingBadge';
import { useAppSelector } from '../../store/hooks';

const MoreButton = ({
	size,
	...props
}: ControlButtonProps): JSX.Element => {
    const unseenFiles = useAppSelector((state) => state.ui.unseenFiles);
	
	return (
		<ControlButton
			aria-haspopup
			size={size}
			{ ...props }
		>
			<PulsingBadge color='primary' badgeContent={unseenFiles} key={unseenFiles}>
				<MoreIcon fontSize={size} />
			</PulsingBadge>
		</ControlButton>
	);
};

export default MoreButton;
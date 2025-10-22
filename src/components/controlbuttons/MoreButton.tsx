import MoreIcon from '@mui/icons-material/MoreVert';
import ControlButton, { ControlButtonProps } from './ControlButton';

const MoreButton = ({
	size,
	...props
}: ControlButtonProps): React.JSX.Element => {
	return (
		<ControlButton
			aria-haspopup
			size={size}
			{ ...props }
		>
			<MoreIcon fontSize={size} />
		</ControlButton>
	);
};

export default MoreButton;
import MoreIcon from '@mui/icons-material/MoreVert';
import ControlButton, { ControlButtonProps } from './ControlButton';

const MoreButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	return (
		<ControlButton
			aria-haspopup
			{ ...props }
		>
			<MoreIcon />
		</ControlButton>
	);
};

export default MoreButton;
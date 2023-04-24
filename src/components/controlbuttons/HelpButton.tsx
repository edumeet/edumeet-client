import { Help } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { helpLabel } from '../translated/translatedComponents';
import ControlButton, { ControlButtonProps } from './ControlButton';

const HelpButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const helpOpen = useAppSelector((state) => state.ui.helpOpen);

	return (
		<ControlButton
			toolTip={ helpLabel() }
			onClick={ () => dispatch(
				uiActions.setUi({ helpOpen: !helpOpen })
			) }
			{ ...props }
		>
			<Help />
		</ControlButton>
	);
};

export default HelpButton;
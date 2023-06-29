import { Help } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { helpLabel } from '../translated/translatedComponents';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

const HelpContainer = styled(Box)(({ theme }) => ({
	position: 'absolute',
	bottom: theme.spacing(1),
	left: theme.spacing(1),
	color: 'white',
}));

const HelpButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const helpOpen = useAppSelector((state) => state.ui.helpOpen);

	return (
		<HelpContainer>
			<ControlButton
				toolTip={ helpLabel() }
				onClick={ () => dispatch(
					uiActions.setUi({ helpOpen: !helpOpen })
				) }
				{ ...props }
			>
				<Help />
			</ControlButton>
		</HelpContainer>
	);
};

export default HelpButton;
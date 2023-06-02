import { NetworkCheck } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { statsLabel } from '../translated/translatedComponents';
import ControlButton, { ControlButtonProps } from './ControlButton';

const StatsButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const statsOpen = useAppSelector((state) => state.ui.statsOpen);

	return (
		<ControlButton
			toolTip={ statsLabel() }
			onClick={ () => dispatch(
				uiActions.setUi({ statsOpen: !statsOpen })
			) }
			{ ...props }
		>
			<NetworkCheck />
		</ControlButton>
	);
};

export default StatsButton;
import { Button, ButtonProps } from '@mui/material';
import { SettingsInputAntenna } from '@mui/icons-material';
import { useAppDispatch } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import edumeetConfig from '../../utils/edumeetConfig';
import { checkConnectionLabel } from '../translated/translatedComponents';

/**
 * Opens the connectivity dialog on demand, so the check is available before
 * anything has gone wrong - nothing ever pops it up by itself.
 *
 * Rendered only when the client monitor is configured, since the dialog is
 * built entirely from its stats and would have nothing to show without it.
 */
const ConnectivityButton = ({ size }: Pick<ButtonProps, 'size'> = {}): React.JSX.Element => {
	const dispatch = useAppDispatch();

	if (!edumeetConfig.connectivityCheckEnabled) return <></>;
	if (!edumeetConfig.clientMonitor) return <></>;

	const handleOpen = (): void => {
		dispatch(uiActions.setUi({ connectivityDialogOpen: true }));
	};

	return (
		<Button
			aria-label={checkConnectionLabel()}
			variant='contained'
			onClick={handleOpen}
			startIcon={<SettingsInputAntenna />}
			size={size}
		>
			{checkConnectionLabel()}
		</Button>
	);
};

export default ConnectivityButton;

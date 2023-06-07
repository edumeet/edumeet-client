import {
	Button,
	DialogActions,
	DialogTitle,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import StyledDialog from '../dialog/StyledDialog';
import {
	closeLabel,
	helpLabel,
} from '../translated/translatedComponents';
import ShortcutKeys from './ShortcutKeys';

const HelpDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const helpOpen = useAppSelector((state) => state.ui.helpOpen);

	const handleCloseHelp = (): void => {
		dispatch(uiActions.setUi({
			helpOpen: !helpOpen
		}));
	};

	return (
		<StyledDialog
			open={ helpOpen }
			onClose={ handleCloseHelp }
			maxWidth='md'
		>
			<DialogTitle>
				{ helpLabel() }
			</DialogTitle>
			<ShortcutKeys />
			<DialogActions>
				<Button
					onClick={ handleCloseHelp }
					startIcon={ <Close /> }
				>
					{ closeLabel() }
				</Button>
			</DialogActions>
		</StyledDialog>
	);
};

export default HelpDialog;
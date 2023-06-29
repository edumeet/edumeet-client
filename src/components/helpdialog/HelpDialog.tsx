import { Button } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { closeLabel } from '../translated/translatedComponents';
import ShortcutKeys from './ShortcutKeys';
import GenericDialog from '../genericdialog/GenericDialog';

const HelpDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const helpOpen = useAppSelector((state) => state.ui.helpOpen);

	const handleCloseHelp = (): void => {
		dispatch(uiActions.setUi({
			helpOpen: !helpOpen
		}));
	};

	return (
		<GenericDialog
			open={ helpOpen }
			onClose={ handleCloseHelp }
			maxWidth='xs'
			content={ <ShortcutKeys /> }
			actions={
				<Button
					onClick={ handleCloseHelp }
					startIcon={ <Close /> }
					variant='contained'
					size='small'
				>
					{ closeLabel() }
				</Button>
			}
		/>
	);
};

export default HelpDialog;
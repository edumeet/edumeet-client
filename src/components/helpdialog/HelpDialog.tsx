import { Button, Box, Link, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { closeLabel, imprintLabel, privacyLabel } from '../translated/translatedComponents';
import ShortcutKeys from './ShortcutKeys';
import GenericDialog from '../genericdialog/GenericDialog';
import edumeetConfig from '../../utils/edumeetConfig';

const HelpDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const helpOpen = useAppSelector((state) => state.ui.helpOpen);

	const handleCloseHelp = (): void => {
		dispatch(uiActions.setUi({
			helpOpen: !helpOpen
		}));
	};

	const privacyUrl = edumeetConfig.privacyUrl ?? '';
	const imprintUrl = edumeetConfig.imprintUrl ?? '';

	return (
		<GenericDialog
			open={ helpOpen }
			onClose={ handleCloseHelp }
			maxWidth='xs'
			content={ <><ShortcutKeys /></> }
			actions={
				<Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
					<Box display="flex" alignItems="left">
						{imprintUrl.trim() !== '' && (
							<Link href={imprintUrl} target="_blank" color="inherit" underline="none">
								<Typography variant="body2">{ imprintLabel() }</Typography>
							</Link>
						)}
						{privacyUrl.trim() !== '' && (
							<Link href={privacyUrl} target="_blank" color="inherit" underline="none" style={{ marginLeft: '16px' }}>
								<Typography variant="body2">{ privacyLabel() }</Typography>
							</Link>
						)}
					</Box>
					<Button
						onClick={ handleCloseHelp }
						startIcon={ <Close /> }
						variant='contained'
						size='small'
					>
						{ closeLabel() }
					</Button>
				</Box>
			}
		/>
	);
};

export default HelpDialog;

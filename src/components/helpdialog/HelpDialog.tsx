import {
	Button,
	DialogActions,
	DialogTitle,
	Tab,
	Tabs
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { HelpTab } from '../../store/slices/roomSlice';
import { uiActions } from '../../store/slices/uiSlice';
import StyledDialog from '../dialog/StyledDialog';
import {
	closeLabel,
	helpLabel,
	shortcutKeysLabel
} from '../translated/translatedComponents';
import ShortcutKeys from './ShortcutKeys';

const tabs: HelpTab[] = [
	'shortcuts'
];

const HelpDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const helpOpen = useAppSelector((state) => state.ui.helpOpen);
	const currentHelpTab = useAppSelector((state) => state.ui.currentHelpTab);

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
			<Tabs
				value={ tabs.indexOf(currentHelpTab) }
				onChange={ (_event, value) =>
					dispatch(uiActions.setCurrentHelpTab(tabs[value]))
				}
				variant='fullWidth'
			>
				<Tab label={ shortcutKeysLabel() } />
			</Tabs>
			{ currentHelpTab === 'shortcuts' && <ShortcutKeys /> }
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
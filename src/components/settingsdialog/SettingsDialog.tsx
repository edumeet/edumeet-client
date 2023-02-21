import {
	Button,
	DialogActions,
	DialogTitle,
	Tab,
	Tabs
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { SettingsTab } from '../../store/slices/roomSlice';
import { uiActions } from '../../store/slices/uiSlice';
import StyledDialog from '../dialog/StyledDialog';
import {
	advancedSettingsLabel,
	appearanceSettingsLabel,
	closeLabel,
	mediaSettingsLabel,
	settingsLabel,
} from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import MediaSettings from './MediaSettings';
import AppearanceSettings from './AppearanceSettings';
import AdvancedSettings from './advancedsettings/AdvancedSettings';

const tabs: SettingsTab[] = [
	'media',
	'appearance',
	'advanced'
];

const SettingsDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const settingsOpen = useAppSelector((state) => state.ui.settingsOpen);
	const currentSettingsTab = useAppSelector((state) => state.ui.currentSettingsTab);

	const handleCloseSettings = (): void => {
		dispatch(uiActions.setUi({
			settingsOpen: !settingsOpen
		}));
	};

	return (
		<StyledDialog
			open={settingsOpen}
			onClose={handleCloseSettings}
			maxWidth='md'
		>
			<DialogTitle>
				{ settingsLabel() }
			</DialogTitle>
			<Tabs
				value={tabs.indexOf(currentSettingsTab)}
				onChange={(_event, value) =>
					dispatch(uiActions.setCurrentSettingsTab(tabs[value]))
				}
				variant='fullWidth'
			>
				<Tab label={mediaSettingsLabel()} />
				<Tab label={appearanceSettingsLabel()} />
				<Tab label={advancedSettingsLabel()} />
			</Tabs>
			{ currentSettingsTab === 'media' && <MediaSettings /> }
			{ currentSettingsTab === 'appearance' && <AppearanceSettings /> }
			{ currentSettingsTab === 'advanced' && <AdvancedSettings /> }
			<DialogActions>
				<Button
					onClick={handleCloseSettings}
					startIcon={<CloseIcon />}
				>
					{ closeLabel()}
				</Button>
			</DialogActions>
		</StyledDialog>
	);
};

export default SettingsDialog;
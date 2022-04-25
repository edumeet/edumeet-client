import {
	Button,
	DialogActions,
	DialogTitle,
	Tab,
	Tabs
} from '@mui/material';
import { useIntl } from 'react-intl';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { SettingsTab } from '../../store/slices/roomSlice';
import { uiActions } from '../../store/slices/uiSlice';
import StyledDialog from '../dialog/StyledDialog';
import {
	appearanceSettingsLabel,
	CloseMessage,
	mediaSettingsLabel,
	SettingsMessage
} from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import MediaSettings from './MediaSettings';
import AppearanceSettings from './AppearanceSettings';

const tabs: SettingsTab[] = [
	'media',
	'appearance'
];

const SettingsDialog = (): JSX.Element => {
	const intl = useIntl();
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
		>
			<DialogTitle>
				<SettingsMessage />
			</DialogTitle>
			<Tabs
				value={tabs.indexOf(currentSettingsTab)}
				onChange={(_event, value) =>
					dispatch(uiActions.setCurrentSettingsTab(tabs[value]))
				}
				variant='fullWidth'
			>
				<Tab label={mediaSettingsLabel(intl)} />
				<Tab label={appearanceSettingsLabel(intl)} />
			</Tabs>
			{ currentSettingsTab === 'media' && <MediaSettings /> }
			{ currentSettingsTab === 'appearance' && <AppearanceSettings /> }
			<DialogActions>
				<Button
					onClick={handleCloseSettings}
					startIcon={<CloseIcon />}
				>
					<CloseMessage />
				</Button>
			</DialogActions>
		</StyledDialog>
	);
};

export default SettingsDialog;
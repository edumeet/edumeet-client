import { Button, Tab, Tabs } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { SettingsTab, uiActions } from '../../store/slices/uiSlice';
import { advancedSettingsLabel, appearanceSettingsLabel, closeLabel, managementSettingsLabel, mediaSettingsLabel } from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import MediaSettings from './MediaSettings';
import AppearanceSettings from './AppearanceSettings';
import GenericDialog from '../genericdialog/GenericDialog';
import AdvancedSettings from './AdvancedSettings';
import MangagementSettings from './ManagementSettings';

const tabs: SettingsTab[] = [
	'media',
	'appearance',
	'advanced',
	'management'
];

const SettingsDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const settingsOpen = useAppSelector((state) => state.ui.settingsOpen);
	const currentSettingsTab = useAppSelector((state) => state.ui.currentSettingsTab);
	const closeButtonDisabled = useAppSelector((state) => state.me.videoInProgress || state.me.audioInProgress);

	const handleCloseSettings = (): void => {
		dispatch(uiActions.setUi({
			settingsOpen: !settingsOpen
		}));
	};

	return (
		<GenericDialog
			open={settingsOpen}
			onClose={handleCloseSettings}
			maxWidth='sm'
			content={
				<>
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
						<Tab label={managementSettingsLabel()} />
					</Tabs>
					{ currentSettingsTab === 'media' && <MediaSettings /> }
					{ currentSettingsTab === 'appearance' && <AppearanceSettings /> }
					{ currentSettingsTab === 'advanced' && <AdvancedSettings /> }
					{ currentSettingsTab === 'management' && <MangagementSettings /> }

				</>
			}
			actions={
				<Button
					variant='contained'
					onClick={handleCloseSettings}
					startIcon={<CloseIcon />}
					size='small'
					disabled={closeButtonDisabled}
				>
					{ closeLabel()}
				</Button>
			}
		/>
	);
};

export default SettingsDialog;
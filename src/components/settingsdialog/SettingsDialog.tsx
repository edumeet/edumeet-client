import { Button, Tab, Tabs } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { SettingsTab, uiActions } from '../../store/slices/uiSlice';
import { appearanceSettingsLabel, closeLabel, mediaSettingsLabel } from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import MediaSettings from './MediaSettings';
import AppearanceSettings from './AppearanceSettings';
import GenericDialog from '../genericdialog/GenericDialog';
import { stopPreviewMic, stopPreviewWebcam } from '../../store/actions/mediaActions';
import { mediaActions } from '../../store/slices/mediaSlice';

const tabs: SettingsTab[] = [
	'media',
	'appearance',
];

const SettingsDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const settingsOpen = useAppSelector((state) => state.ui.settingsOpen);
	const currentSettingsTab = useAppSelector((state) => state.ui.currentSettingsTab);

	const handleCloseSettings = (): void => {
		dispatch(uiActions.setUi({
			settingsOpen: !settingsOpen
		}));

		dispatch(stopPreviewMic());
		dispatch(stopPreviewWebcam());
		dispatch(mediaActions.resetPreviewBlurBackground());
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
					</Tabs>
					{ currentSettingsTab === 'media' && <MediaSettings /> }
					{ currentSettingsTab === 'appearance' && <AppearanceSettings /> }
				</>
			}
			actions={
				<Button
					variant='contained'
					onClick={handleCloseSettings}
					startIcon={<CloseIcon />}
					size='small'
				>
					{ closeLabel()}
				</Button>
			}
		/>
	);
};

export default SettingsDialog;
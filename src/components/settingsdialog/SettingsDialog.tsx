import { Button, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { SettingsTab, uiActions } from '../../store/slices/uiSlice';
import { advancedSettingsLabel, appearanceSettingsLabel, closeLabel, managementSettingsLabel, mediaSettingsLabel } from '../translated/translatedComponents';
import CloseIcon from '@mui/icons-material/Close';
import PhotoIcon from '@mui/icons-material/Photo';
import PaletteIcon from '@mui/icons-material/Palette';
import TuneIcon from '@mui/icons-material/Tune';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MediaSettings from './MediaSettings';
import AppearanceSettings from './AppearanceSettings';
import GenericDialog from '../genericdialog/GenericDialog';
import AdvancedSettings from './AdvancedSettings';
import MangagementSettings from './ManagementSettings';
import edumeetConfig from '../../utils/edumeetConfig';

const tabs: SettingsTab[] = [
	'media',
	'appearance',
	'advanced',
	'management'
];

const SettingsDialog = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const settingsOpen = useAppSelector((state) => state.ui.settingsOpen);
	const currentSettingsTab = useAppSelector((state) => state.ui.currentSettingsTab);
	const closeButtonDisabled = useAppSelector((state) => state.me.videoInProgress || state.me.audioInProgress);
	const locale = useAppSelector((state) => state.settings.locale);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const dummy = locale; // force re-render when locale changes

	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
						onChange={(_event, value) => {
							if ((!edumeetConfig.loginEnabled && tabs[value] !== 'management') || edumeetConfig.loginEnabled) {
								dispatch(uiActions.setCurrentSettingsTab(tabs[value]));
							}
						}}
						centered
						variant={isMobile ? 'scrollable' : 'standard'}
						scrollButtons={isMobile ? 'auto' : false}
						allowScrollButtonsMobile={isMobile}
					>
						<Tab
							label={isMobile ? undefined : mediaSettingsLabel()}
							icon={isMobile ? <PhotoIcon /> : undefined}
							aria-label={mediaSettingsLabel()}
						/>
						<Tab
							label={isMobile ? undefined : appearanceSettingsLabel()}
							icon={isMobile ? <PaletteIcon /> : undefined}
							aria-label={appearanceSettingsLabel()}
						/>
						<Tab
							label={isMobile ? undefined : advancedSettingsLabel()}
							icon={isMobile ? <TuneIcon /> : undefined}
							aria-label={advancedSettingsLabel()}
						/>
						{edumeetConfig.loginEnabled && (
							<Tab
								label={isMobile ? undefined : managementSettingsLabel()}
								icon={isMobile ? <AdminPanelSettingsIcon /> : undefined}
								aria-label={managementSettingsLabel()}
							/>
						)}
					</Tabs>
					{currentSettingsTab === 'media' && <MediaSettings />}
					{currentSettingsTab === 'appearance' && <AppearanceSettings />}
					{currentSettingsTab === 'advanced' && <AdvancedSettings />}
					{currentSettingsTab === 'management' && <MangagementSettings />}
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
					{closeLabel()}
				</Button>
			}
		/>
	);
};

export default SettingsDialog;
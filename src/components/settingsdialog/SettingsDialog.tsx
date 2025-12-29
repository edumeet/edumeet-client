import { Box, Button, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoIcon from '@mui/icons-material/Photo';
import PaletteIcon from '@mui/icons-material/Palette';
import TuneIcon from '@mui/icons-material/Tune';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { SettingsTab, uiActions } from '../../store/slices/uiSlice';
import {
	advancedSettingsLabel,
	appearanceSettingsLabel,
	closeLabel,
	managementSettingsLabel,
	mediaSettingsLabel
} from '../translated/translatedComponents';

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
	const closeButtonDisabled = useAppSelector(
		(state) => state.me.videoInProgress || state.me.audioInProgress
	);

	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const handleCloseSettings = (): void => {
		dispatch(
			uiActions.setUi({
				settingsOpen: !settingsOpen
			})
		);
	};

	const handleTabChange = (_event: React.SyntheticEvent, value: number): void => {
		const nextTab = tabs[value];

		if ((!edumeetConfig.loginEnabled && nextTab !== 'management') || edumeetConfig.loginEnabled) {
			dispatch(uiActions.setCurrentSettingsTab(nextTab));
		}
	};

	return (
		<GenericDialog
			open={settingsOpen}
			onClose={handleCloseSettings}
			maxWidth={isMobile ? 'sm' : 'sm'}
			content={
				<>
					<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
						<Tabs
							value={tabs.indexOf(currentSettingsTab)}
							onChange={handleTabChange}
							variant={isMobile ? 'scrollable' : 'fullWidth'}
							scrollButtons={isMobile ? 'auto' : false}
							allowScrollButtonsMobile
							centered={false}
						>
							<Tab
								icon={<PhotoIcon />}
								iconPosition='start'
								label={isMobile ? undefined : mediaSettingsLabel()}
								aria-label={mediaSettingsLabel()}
							/>
							<Tab
								icon={<PaletteIcon />}
								iconPosition='start'
								label={isMobile ? undefined : appearanceSettingsLabel()}
								aria-label={appearanceSettingsLabel()}
							/>
							<Tab
								icon={<TuneIcon />}
								iconPosition='start'
								label={isMobile ? undefined : advancedSettingsLabel()}
								aria-label={advancedSettingsLabel()}
							/>
							{edumeetConfig.loginEnabled && (
								<Tab
									icon={<AdminPanelSettingsIcon />}
									iconPosition='start'
									label={isMobile ? undefined : managementSettingsLabel()}
									aria-label={managementSettingsLabel()}
								/>
							)}
						</Tabs>
					</Box>

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
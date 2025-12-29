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
import AdvancedSettings from './AdvancedSettings';
import MangagementSettings from './ManagementSettings';
import GenericDialog from '../genericdialog/GenericDialog';
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
			maxWidth='sm'
			fullWidth
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
								{...(isMobile
									? {
											icon: <PhotoIcon />,
											'aria-label': mediaSettingsLabel()
										}
									: {
											label: mediaSettingsLabel()
										})}
							/>
							<Tab
								{...(isMobile
									? {
											icon: <PaletteIcon />,
											'aria-label': appearanceSettingsLabel()
										}
									: {
											label: appearanceSettingsLabel()
										})}
							/>
							<Tab
								{...(isMobile
									? {
											icon: <TuneIcon />,
											'aria-label': advancedSettingsLabel()
										}
									: {
											label: advancedSettingsLabel()
										})}
							/>
							{edumeetConfig.loginEnabled && (
								<Tab
									{...(isMobile
										? {
												icon: <AdminPanelSettingsIcon />,
												'aria-label': managementSettingsLabel()
											}
										: {
												label: managementSettingsLabel()
											})}
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
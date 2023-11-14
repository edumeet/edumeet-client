import {
	FormControlLabel,
	FormGroup,
	Switch
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import LanguageSelector from '../languageselector/LanguageSelector';
import {
	hideNoVideoParticipantsLabel,
	hideSelfViewLabel,
	mirroredSelfViewLabel,
	enableNotificationSoundsLabel,
	enableVerticallyStackedSidePanels,
} from '../translated/translatedComponents';
import LastNSlider from '../lastnslider/LastNSlider';

const AppearanceSettings = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const {
		mirroredSelfView,
		hideNonVideo,
		hideSelfView,
		notificationSounds,
		verticalDivide,
	} = useAppSelector((state) => state.settings);

	const handleChange = (
		event: React.ChangeEvent<HTMLInputElement>,
		setting: string
	): void => {
		dispatch(
			settingsActions.updateSettings({ [`${setting}`]: event.target.checked })
		);
	};

	return (
		<>
			<FormGroup>
				<LanguageSelector />
				<LastNSlider />
				<FormControlLabel
					control={
						<Switch
							checked={mirroredSelfView}
							onChange={(event) => handleChange(event, 'mirroredSelfView')}
							inputProps={{ 'aria-label': 'controlled' }}
						/>
					}
					label={mirroredSelfViewLabel()}
				/>
				<FormControlLabel
					control={
						<Switch
							checked={hideSelfView}
							onChange={(event) => handleChange(event, 'hideSelfView')}
							inputProps={{ 'aria-label': 'controlled' }}
						/>
					}
					label={hideSelfViewLabel()}
				/>
				<FormControlLabel
					control={
						<Switch
							checked={hideNonVideo}
							onChange={(event) => handleChange(event, 'hideNonVideo')}
							inputProps={{ 'aria-label': 'controlled' }}
						/>
					}
					label={hideNoVideoParticipantsLabel()}
				/>
				<FormControlLabel
					control={
						<Switch
							checked={ notificationSounds }
							onChange={ (event) => handleChange(event, 'notificationSounds') }
							inputProps={ { 'aria-label': 'controlled' } }
						/>
					}
					label={ enableNotificationSoundsLabel() }
				/>
				<FormControlLabel
					control={
						<Switch
							checked={ verticalDivide }
							onChange={ (event) => handleChange(event, 'verticalDivide') }
							inputProps={ { 'aria-label': 'controlled' } }
						/>
					}
					label={ enableVerticallyStackedSidePanels() }
				/>
			</FormGroup>
		</>
	);
};

export default AppearanceSettings;
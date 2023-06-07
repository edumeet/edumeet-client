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
	controlButtonsBarLabel,
	enableNotificationSoundsLabel,
} from '../translated/translatedComponents';
import { isMobileSelector } from '../../store/selectors';

const AppearanceSettings = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const {
		mirroredSelfView,
		hideNonVideo,
		hideSelfView,
		controlButtonsBar,
		notificationSounds
	} = useAppSelector((state) => state.settings);
	const isMobile = useAppSelector(isMobileSelector);

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
				{ !isMobile && (
					<FormControlLabel
						control={
							<Switch
								disabled={hideSelfView}
								checked={controlButtonsBar}
								onChange={(event) => handleChange(event, 'controlButtonsBar')}
								inputProps={{ 'aria-label': 'controlled' }}
							/>
						}
						label={controlButtonsBarLabel()}
					/>
				) }
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
			</FormGroup>
		</>
	);
};

export default AppearanceSettings;
import { FormControlLabel, FormGroup, Switch } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import {
	hideNoVideoParticipantsLabel,
	mirroredSelfViewLabel
} from '../translated/translatedComponents';

const AppearanceSettings = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const {
		mirroredSelfView,
		hideNonVideo,
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
							checked={hideNonVideo}
							onChange={(event) => handleChange(event, 'hideNonVideo')}
							inputProps={{ 'aria-label': 'controlled' }}
						/>
					}
					label={hideNoVideoParticipantsLabel()}
				/>
			</FormGroup>
		</>
	);
};

export default AppearanceSettings;
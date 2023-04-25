import { FormControlLabel, FormGroup, Switch } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { settingsActions } from '../../../store/slices/settingsSlice';
import { enableNotificationSoundsLabel } from '../../translated/translatedComponents';

const AdvancedSettings = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const { notificationSounds } = useAppSelector((state) => state.settings);

	const handleChange = (
		event: React.ChangeEvent<HTMLInputElement>,
		setting: string
	): void => {
		dispatch(
			settingsActions.updateSettings({ [`${setting}`]: event.target.checked })
		);
	};

	return (
		<FormGroup>
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
	);
};

export default AdvancedSettings;
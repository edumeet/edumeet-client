import {
	FormControl,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	MenuItem,
	Select,
	SelectChangeEvent,
	Switch
} from '@mui/material';
import { setLocale } from '../../store/actions/localeActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import { ILocale, localeList } from '../../utils/intlManager';
import {
	hideNoVideoParticipantsLabel,
	mirroredSelfViewLabel,
	selectLanguageLabel
} from '../translated/translatedComponents';

const AppearanceSettings = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const {
		mirroredSelfView,
		hideNonVideo,
		locale
	} = useAppSelector((state) => state.settings);
	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);

	const handleChange = (
		event: React.ChangeEvent<HTMLInputElement>,
		setting: string
	): void => {
		dispatch(
			settingsActions.updateSettings({ [`${setting}`]: event.target.checked })
		);
	};

	const handleLocaleChange = (event: SelectChangeEvent<string>): void => {
		dispatch(setLocale(event.target.value));
	};

	return (
		<>
			<FormGroup>
				<FormControl fullWidth>
					<Select
						value={locale}
						onChange={handleLocaleChange}
						displayEmpty
						autoWidth
						disabled={localeInProgress}
					>
						{ localeList.map(({ name, locale: listLocale }: ILocale, index) => (
							<MenuItem key={index} value={listLocale[0]} >
								{ name }
							</MenuItem>
						))}
					</Select>
					<FormHelperText>
						{ selectLanguageLabel() }
					</FormHelperText>
				</FormControl>
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
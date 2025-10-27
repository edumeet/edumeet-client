import {
	FormControl,
	FormHelperText,
	MenuItem,
	Select,
	SelectChangeEvent,
} from '@mui/material';
import { setLocale } from '../../store/actions/localeActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { ILocale, localeList } from '../../utils/intlManager';
import {
	selectLanguageLabel
} from '../translated/translatedComponents';

const LanguageSelector = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const locale = useAppSelector((state) => state.settings.locale);
	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);

	const handleLocaleChange = (event: SelectChangeEvent<string>): void => {
		dispatch(setLocale(event.target.value));
	};

	return (
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
	);
};

export default LanguageSelector;
import {
	FormControl,
	FormHelperText,
	IconButton,
	Menu,
	MenuItem,
	Select,
	SelectChangeEvent,
	Tooltip,
} from '@mui/material';
import { Language } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { setLocale } from '../../store/actions/localeActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { findLocale, localeList } from '../../utils/intlManager';
import {
	selectLanguageLabel
} from '../translated/translatedComponents';

interface LanguageSelectorProps {
	// A globe icon button that opens the list of languages, for the bottom of a dialog.
	compact?: boolean;
}

const LanguageSelector = ({ compact = false }: LanguageSelectorProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const locale = useAppSelector((state) => state.settings.locale);
	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);
	const [ menuAnchor, setMenuAnchor ] = useState<HTMLElement | null>(null);
	const theme = useTheme();
	// Until the language is loaded, the stored value can be a browser tag like cs-cz.
	const value = (locale && findLocale(locale)?.locale[0]) || 'en';

	const handleLocaleChange = (event: SelectChangeEvent<string>): void => {
		dispatch(setLocale(event.target.value));
	};

	if (compact) {
		return (
			<>
				{/* Beside the icon, towards the free end of the row; MUI does not mirror the placement right to left. */}
				<Tooltip title={selectLanguageLabel()} placement={theme.direction === 'rtl' ? 'left' : 'right'}>
					<span>
						<IconButton
							size='small'
							aria-label={selectLanguageLabel()}
							aria-haspopup='menu'
							aria-expanded={menuAnchor !== null}
							disabled={localeInProgress}
							onClick={(event) => setMenuAnchor(event.currentTarget)}
						>
							<Language fontSize='small' />
						</IconButton>
					</span>
				</Tooltip>
				<Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
					{ localeList.map(({ name, locale: listLocale }) => (
						<MenuItem
							key={listLocale[0]}
							selected={listLocale[0] === value}
							onClick={() => {
								setMenuAnchor(null);
								dispatch(setLocale(listLocale[0]));
							}}
						>
							{ name }
						</MenuItem>
					))}
				</Menu>
			</>
		);
	}

	return (
		<FormControl fullWidth>
			<Select
				value={value}
				onChange={handleLocaleChange}
				displayEmpty
				autoWidth
				disabled={localeInProgress}
			>
				{ localeList.map(({ name, locale: listLocale }) => (
					<MenuItem key={listLocale[0]} value={listLocale[0]} >
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

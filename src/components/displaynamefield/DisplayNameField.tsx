import { ChangeEvent, FocusEvent } from 'react';
import { useIntl } from 'react-intl';
import { InputAdornment, TextField } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

interface DisplayNameFieldProps {
	displayName: string;
	// eslint-disable-next-line no-unused-vars
	setDisplayName: (displayName: string) => void;
	disabled?: boolean;
}

const DisplayNameField = ({
	displayName,
	setDisplayName,
	disabled,
}: DisplayNameFieldProps) => {
	const intl = useIntl();

	return (
		<TextField
			label={intl.formatMessage({
				id: 'label.yourName',
				defaultMessage: 'Your name'
			})}
			value={displayName}
			variant='outlined'
			margin='normal'
			disabled={disabled}
			onFocus={(event: FocusEvent<HTMLInputElement>) => event.target.select()}
			InputProps={{
				startAdornment: (
					<InputAdornment position='start' children={<AccountCircle />} />
				)
			}}
			onChange={(event: ChangeEvent<HTMLInputElement>) => {
				const name = event.target.value;

				setDisplayName(name.trim() ? name : name.trim());
			}}
			fullWidth
		/>
	);
};

export default DisplayNameField;
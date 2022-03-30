import { ChangeEvent, FocusEvent, ReactNode } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import randomString from 'random-string';

interface TextInputFieldProps {
	label: string;
	value: string;
	// eslint-disable-next-line no-unused-vars
	setValue: (value: string) => void;
	disabled?: boolean;
	adornment?: ReactNode;
	randomizeOnBlank?: boolean;
}

const TextInputField = ({
	label,
	value,
	setValue,
	disabled,
	adornment,
	randomizeOnBlank,
}: TextInputFieldProps): JSX.Element => {
	return (
		<TextField
			label={label}
			value={value}
			variant='outlined'
			margin='normal'
			disabled={disabled}
			onFocus={(event: FocusEvent<HTMLInputElement>) => event.target.select()}
			InputProps={{
				startAdornment: (
					<InputAdornment position='start' children={adornment} />
				)
			}}
			onChange={(event: ChangeEvent<HTMLInputElement>) => {
				setValue(event.target.value);
			}}
			onBlur={() => {
				if (randomizeOnBlank && !value.trim())
					setValue(randomString({ length: 8 }).toLowerCase());
			}}
			fullWidth
		/>
	);
};

export default TextInputField;
import { ChangeEvent, FocusEvent, KeyboardEvent, ReactNode } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import randomString from 'random-string';

interface TextInputFieldProps {
	label: string;
	value: string;
	// eslint-disable-next-line no-unused-vars
	setValue: (value: string) => void;
	onEnter?: () => void;
	disabled?: boolean;
	margin?: 'dense' | 'none' | 'normal';
	startAdornment?: ReactNode;
	endAdornment?: ReactNode;
	randomizeOnBlank?: boolean;
	autoFocus?: boolean;
}

const TextInputField = ({
	value,
	setValue,
	onEnter,
	startAdornment,
	endAdornment,
	randomizeOnBlank,
	...rest
}: TextInputFieldProps): JSX.Element => {
	return (
		<TextField
			value={value}
			variant='outlined'
			onFocus={(event: FocusEvent<HTMLInputElement>) => event.target.select()}
			InputProps={{
				startAdornment: (
					<InputAdornment position='start' children={startAdornment} />
				),
				endAdornment: (
					<InputAdornment position='end' children={endAdornment} />
				),
			}}
			onChange={(event: ChangeEvent<HTMLInputElement>) => {
				setValue(event.target.value);
			}}
			onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
				if (event.key === 'Enter') {
					onEnter?.();
				}
			}}
			onBlur={() => {
				if (randomizeOnBlank && !value.trim())
					setValue(randomString({ length: 8 }).toLowerCase());
			}}
			fullWidth
			{...rest}
		/>
	);
};

export default TextInputField;
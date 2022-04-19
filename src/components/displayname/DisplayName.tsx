import { styled, TextField } from '@mui/material';
import { ChangeEvent, FocusEvent, useEffect, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';

const StyledTextField = styled(TextField)(({ theme }) => ({
	position: 'absolute',
	bottom: theme.spacing(1),
	left: theme.spacing(1),
	margin: 0,
	zIndex: 22,
	input: {
		color: 'white',
		margin: 0,
		padding: 0,
	},
	'.MuiInputBase-input.Mui-disabled': {
		WebkitTextFillColor: 'white',
		color: 'white'
	}
}));

interface DisplayNameProps {
	displayName?: string;
	disabled?: boolean;
}

const DisplayName = ({
	displayName,
	disabled = true
}: DisplayNameProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const [ value, setValue ] = useState(displayName);

	useEffect(() => setValue(displayName), [ displayName ]);

	return (
		<StyledTextField
			value={value}
			disabled={disabled}
			margin='dense'
			variant='standard'
			size='small'
			onFocus={(event: FocusEvent<HTMLInputElement>) => event.target.select()}
			onChange={(event: ChangeEvent<HTMLInputElement>) => {
				setValue(event.target.value);
			}}
			onBlur={() => {
				if (value && value !== displayName) {
					dispatch(settingsActions.setDisplayName(value));
				}
			}}
		/>
	);
};

export default DisplayName;
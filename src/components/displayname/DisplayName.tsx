import { Chip, styled, TextField } from '@mui/material';
import { ChangeEvent, FocusEvent, useEffect, useState } from 'react';
import { setDisplayName } from '../../store/actions/meActions';
import { useAppDispatch } from '../../store/hooks';

const StyledTextField = styled(TextField)(({ theme }) => ({
	position: 'absolute',
	bottom: theme.spacing(1),
	left: theme.spacing(1),
	zIndex: 22,
}));

const StyledChip = styled(Chip)(({ theme }) => ({
	position: 'absolute',
	bottom: theme.spacing(1),
	left: theme.spacing(1),
	zIndex: 22,
	color: 'white',
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
	const [ isEditing, setIsEditing ] = useState(false);

	useEffect(() => setValue(displayName), [ displayName ]);

	return (
		isEditing ?
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
						dispatch(setDisplayName(value));
					}

					setIsEditing(false);
				}}
			/>
			:
			<StyledChip
				label={value}
				variant='outlined'
				disabled={disabled}
				onClick={() => setIsEditing(true)}
			/>
	);
};

export default DisplayName;
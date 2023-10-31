import { Chip, styled, TextField } from '@mui/material';
import { ChangeEvent, FocusEvent, useEffect, useState } from 'react';
import { setDisplayName } from '../../store/actions/meActions';
import { useAppDispatch } from '../../store/hooks';
import StateIndicators from '../stateindicators/StateIndicators';
import { meLabel } from '../translated/translatedComponents';

const StyledTextField = styled(TextField)(({ theme }) => ({
	position: 'absolute',
	bottom: theme.spacing(1),
	left: theme.spacing(1),
	color: 'white',
	'& .MuiFilledInput-root': {
		color: 'white',
	},
	'& .MuiOutlinedInput-root': {
		color: 'white',
	},
}));

const StyledChip = styled(Chip)(({ theme }) => ({
	position: 'absolute',
	bottom: theme.spacing(1),
	left: theme.spacing(1),
	color: 'white',
}));

interface DisplayNameProps {
	displayName?: string;
	disabled?: boolean;
	peerId?: string;
	isMe?: boolean;
}

const DisplayName = ({
	displayName,
	disabled = true,
	peerId,
	isMe,
}: DisplayNameProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const [ value, setValue ] = useState(displayName);
	const [ isEditing, setIsEditing ] = useState(false);

	useEffect(() => setValue(displayName), [ displayName ]);

	const handleFinished = () => {
		if (value && value !== displayName)
			dispatch(setDisplayName(value));

		setIsEditing(false);
	};

	const prefix = isMe && !isEditing ? `(${meLabel()}) ` : '';

	return (
		isEditing ?
			<StyledTextField
				value={`${prefix}${value}`}
				disabled={disabled}
				margin='dense'
				variant='filled'
				size='small'
				onFocus={(event: FocusEvent<HTMLInputElement>) => event.target.select()}
				onChange={(event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
				onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
					if (event.key === 'Enter')
						handleFinished();
				}}
				onBlur={handleFinished}
				color='primary'
				autoFocus
			/>
			:
			<StyledChip
				label={`${prefix}${value}`}
				variant='filled'
				size='small'
				onClick={() => !disabled && setIsEditing(true)}
				avatar={ peerId ? <StateIndicators peerId={peerId} /> : undefined }
			/>
	);
};

export default DisplayName;
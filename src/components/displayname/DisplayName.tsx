import { Chip, styled, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { setDisplayName } from '../../store/actions/meActions';
import { useAppDispatch } from '../../store/hooks';
import StateIndicators from '../stateindicators/StateIndicators';
import { meLabel } from '../translated/translatedComponents';
import MeStateIndicators from '../stateindicators/MeStateIndicators';

const StyledTextField = styled(TextField)(({ theme }) => ({
	position: 'absolute',
	bottom: theme.spacing(1),
	left: theme.spacing(1),
	color: 'white',
	'& .MuiFilledInput-root': {
		color: 'white',
	},
	'& .MuiInputBase-input': {
		marginTop: 0,
		marginBottom: 0,
		paddingTop: 0,
		paddingBottom: 0,
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
}: DisplayNameProps): React.JSX.Element => {
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
				onFocus={(event) => event.target.select()}
				onChange={(event) => setValue(event.target.value)}
				onKeyDown={(event) => {
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
				avatar={ peerId ? <StateIndicators peerId={peerId} /> : <MeStateIndicators /> }
			/>
	);
};

export default DisplayName;

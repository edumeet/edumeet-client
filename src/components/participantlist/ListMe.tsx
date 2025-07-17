import { Box, Paper, TextField, styled } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import EscapeMeetingButton from '../controlbuttons/EscapeMeetingButton';
import { meLabel } from '../translated/translatedComponents';
import { useEffect, useState } from 'react';
import { setDisplayName } from '../../store/actions/meActions';

const StyledTextField = styled(TextField)(() => ({
	flexGrow: 1,
	margin: 0,
	'& .MuiFilledInput-root': {
		height: '2rem',
	},
	'& .MuiInputBase-input': {
		marginTop: 0,
		marginBottom: 0,
		paddingTop: 0,
		paddingBottom: 0,
	},
}));

const MeDiv = styled(Paper)(({ theme }) => ({
	display: 'flex',
	padding: theme.spacing(0.25),
	marginTop: theme.spacing(0.5),
	backgroundColor: theme.sideContentItemColor,
}));

const MeInfoDiv = styled(Box)(({ theme }) => ({
	display: 'flex',
	marginLeft: theme.spacing(1),
	flexGrow: 1,
	alignItems: 'center'
}));

const MeAvatar = styled('img')({
	borderRadius: '50%',
	height: '1.5rem',
	width: '1.5rem',
	objectFit: 'cover',
	alignSelf: 'center',
});

const ListMe = (): JSX.Element => {
	const picture = useAppSelector((state) => state.me.picture);
	const displayName = useAppSelector((state) => state.settings.displayName);

	const dispatch = useAppDispatch();
	const [ value, setValue ] = useState(displayName);
	const [ isEditing, setIsEditing ] = useState(false);

	useEffect(() => setValue(displayName), [ displayName ]);

	const handleFinished = () => {
		if (value && value !== displayName)
			dispatch(setDisplayName(value));

		setIsEditing(false);
	};

	const prefix = !isEditing ? `(${meLabel()}) ` : '';

	return (
		<MeDiv>
			<MeAvatar src={picture ?? '/images/buddy.svg'} />
			{ isEditing ?
				<StyledTextField
					value={`${prefix}${value}`}
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
				<MeInfoDiv onClick={() => setIsEditing(true)}>
					{`${prefix}${value}`}
				</MeInfoDiv>
			}
			<EscapeMeetingButton type='iconbutton' size='small' />
		</MeDiv>
	);
};

export default ListMe;

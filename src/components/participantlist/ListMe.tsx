import { Box, Paper, styled } from '@mui/material';
import {
	useAppSelector,
} from '../../store/hooks';
import EscapeMeetingButton from '../controlbuttons/EscapeMeetingButton';
import RaiseHandButton from '../controlbuttons/RaiseHandButton';

const MeDiv = styled(Paper)(({ theme }) => ({
	display: 'flex',
	padding: theme.spacing(0.5),
	marginTop: theme.spacing(0.5),
}));

const MeInfoDiv = styled(Box)(({ theme }) => ({
	display: 'flex',
	marginLeft: theme.spacing(1),
	flexGrow: 1,
	alignItems: 'center'
}));

const MeAvatar = styled('img')({
	borderRadius: '50%',
	height: '2rem',
	width: '2rem',
	objectFit: 'cover',
	alignSelf: 'center',
});

const ListMe = (): JSX.Element => {
	const picture = useAppSelector((state) => state.me.picture);
	const displayName = useAppSelector((state) => state.settings.displayName);

	return (
		<MeDiv>
			<MeAvatar src={picture ?? '/images/buddy.svg'} />
			<MeInfoDiv>{ displayName }</MeInfoDiv>
			<EscapeMeetingButton type='iconbutton' size='small' />
			<RaiseHandButton type='iconbutton' size='small' />
		</MeDiv>
	);
};

export default ListMe;
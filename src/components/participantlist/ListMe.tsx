import { styled } from '@mui/material';
import {
	useAppSelector,
} from '../../store/hooks';
import EscapeMeetingButton from '../controlbuttons/EscapeMeetingButton';
import RaiseHandButton from '../controlbuttons/RaiseHandButton';

const MeDiv = styled('div')({
	width: '100%',
	overflow: 'hidden',
	cursor: 'auto',
	display: 'flex'
});

const MeInfoDiv = styled('div')(({ theme }) => ({
	fontSize: '1rem',
	display: 'flex',
	paddingLeft: theme.spacing(1),
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
			<EscapeMeetingButton type='iconbutton' />
			<RaiseHandButton type='iconbutton' />
		</MeDiv>
	);
};

export default ListMe;
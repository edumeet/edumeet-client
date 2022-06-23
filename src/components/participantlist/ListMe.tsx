import { styled } from '@mui/material';
import {
	useAppSelector,
} from '../../store/hooks';
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
	backgroundRepeat: 'no-repeat',
	backgroundPosition: 'center center',
	// eslint-disable-next-line quotes
	backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'%3e%3cpath d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z' /%3e%3c/svg%3e")`,
});

const ListMe = (): JSX.Element => {
	const picture = useAppSelector((state) => state.me.picture);
	const displayName = useAppSelector((state) => state.settings.displayName);

	return (
		<MeDiv>
			<MeAvatar src={picture} />
			<MeInfoDiv>{ displayName }</MeInfoDiv>
			<RaiseHandButton type='iconbutton' />
		</MeDiv>
	);
};

export default ListMe;
import { styled } from '@mui/material';
import CloseMeetingButton from '../textbuttons/CloseMeetingButton';
import MuteAllButton from '../textbuttons/MuteAllButton';
import StopAllScreenshareButton from '../textbuttons/StopAllScreenshareButton';
import StopAllVideoButton from '../textbuttons/StopAllVideoButton';

const ModeratorDiv = styled('div')(({ theme }) => ({
	width: '100%',
	overflow: 'hidden',
	cursor: 'auto',
	display: 'flex',
	flexDirection: 'column',
	gap: theme.spacing(1),
}));

const ListModerator = (): JSX.Element => {
	return (
		<ModeratorDiv>
			<MuteAllButton />
			<StopAllVideoButton />
			<StopAllScreenshareButton />
			<CloseMeetingButton />
		</ModeratorDiv>
	);
};

export default ListModerator;
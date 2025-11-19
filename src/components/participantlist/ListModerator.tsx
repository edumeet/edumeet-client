import { styled } from '@mui/material';
import { memo } from 'react';
import CloseMeetingButton from '../textbuttons/CloseMeetingButton';
import MuteAllButton from '../textbuttons/MuteAllButton';
import StopAllScreenshareButton from '../textbuttons/StopAllScreenshareButton';
import StopAllVideoButton from '../textbuttons/StopAllVideoButton';

const ModeratorDiv = styled('div')(({ theme }) => ({
	// width: '100%',
	overflow: 'hidden',
	cursor: 'auto',
	display: 'flex',
	flexDirection: 'column',
	gap: theme.spacing(0.5),
}));

const ListModerator = (): React.JSX.Element => {
	return (
		<ModeratorDiv>
			<CloseMeetingButton />
			<MuteAllButton />
			<StopAllVideoButton />
			<StopAllScreenshareButton />
		</ModeratorDiv>
	);
};

export default memo(ListModerator);
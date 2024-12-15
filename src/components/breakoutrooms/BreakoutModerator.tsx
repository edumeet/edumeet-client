import { IconButton, styled } from '@mui/material';
import { memo, useState } from 'react';
import { createBreakoutRoomLabel, newBreakoutRoomNameLabel } from '../translated/translatedComponents';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createBreakoutRoom } from '../../store/actions/roomActions';
import TextInputField from '../textinputfield/TextInputField';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { fullscreenConsumerSelector } from '../../store/selectors';

const ModeratorDiv = styled('div')(({ theme }) => ({
	width: '100%',
	overflow: 'hidden',
	cursor: 'auto',
	display: 'flex',
	flexDirection: 'column',
	gap: theme.spacing(1),
}));

const BreakoutModerator = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const [ name, setName ] = useState<string>('');

	const handleCreateBreakoutRoom = () => {
		if (name.trim()) {
			dispatch(createBreakoutRoom(name.trim()));
			setName('');
		}
	};

	const consumer = useAppSelector(fullscreenConsumerSelector);

	return (
		<ModeratorDiv>
			<TextInputField
				label={consumer ? '' : newBreakoutRoomNameLabel()}
				value={name}
				margin='dense'
				setValue={setName}
				onEnter={handleCreateBreakoutRoom}
				endAdornment={
					<IconButton
						aria-label={createBreakoutRoomLabel()}
						size='small'
						disabled={!name.trim()}
						onClick={handleCreateBreakoutRoom}
					>
						<GroupAddIcon />
					</IconButton>
				}
			/>
		</ModeratorDiv>
	);
};

export default memo(BreakoutModerator);
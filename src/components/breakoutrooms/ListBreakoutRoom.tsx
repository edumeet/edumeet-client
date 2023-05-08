import { Button, IconButton, styled } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Fragment } from 'react';
import { BreakoutRoom } from '../../store/slices/breakoutRoomsSlice';
import { closeBreakoutRoom, joinBreakoutRoom, removeBreakoutRoom } from '../../store/actions/roomActions';
import { closeBreakoutRoomLabel, joinBreakoutRoomLabel, removeBreakoutRoomLabel } from '../translated/translatedComponents';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

interface BreakoutRoomProps {
	room: BreakoutRoom;
	changeRoom: boolean;
	createRoom: boolean;
}

const BreakoutRoomDiv = styled('div')({
	width: '100%',
	overflow: 'hidden',
	cursor: 'auto',
	display: 'flex'
});

const BreakoutRoomInfoDiv = styled('div')(({ theme }) => ({
	fontSize: '1rem',
	display: 'flex',
	paddingLeft: theme.spacing(1),
	flexGrow: 1,
	alignItems: 'center'
}));

const BreakoutRoomButton = styled(Button)(({ theme }) => ({
	marginLeft: theme.spacing(1),
}));

const BreakoutRoomIconButton = styled(IconButton)(({ theme }) => ({
	marginLeft: theme.spacing(1),
}));

const ListBreakoutRoom = ({
	room,
	changeRoom,
	createRoom,
}: BreakoutRoomProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const createRoomInProgress = useAppSelector((state) => state.room.updateBreakoutInProgress);
	const changeRoomInProgress = useAppSelector((state) => state.room.transitBreakoutRoomInProgress);

	return (
		<Fragment>
			<BreakoutRoomDiv>
				<BreakoutRoomInfoDiv>{ room.name }</BreakoutRoomInfoDiv>
				<BreakoutRoomButton
					aria-label={joinBreakoutRoomLabel()}
					disabled={!changeRoom || changeRoomInProgress}
					color='primary'
					variant='contained'
					onClick={() => dispatch(joinBreakoutRoom(room.sessionId))}
				>
					{ joinBreakoutRoomLabel() }
				</BreakoutRoomButton>
				<BreakoutRoomButton
					aria-label={closeBreakoutRoomLabel()}
					disabled={!createRoom || createRoomInProgress}
					color='error'
					variant='contained'
					onClick={() => dispatch(closeBreakoutRoom(room.sessionId))}
				>
					{ closeBreakoutRoomLabel() }
				</BreakoutRoomButton>
				<BreakoutRoomIconButton
					aria-label={removeBreakoutRoomLabel()}
					size='small'
					disabled={!createRoom}
					onClick={() => dispatch(removeBreakoutRoom(room.sessionId))}
				>
					<DeleteForeverIcon />
				</BreakoutRoomIconButton>
			</BreakoutRoomDiv>
		</Fragment>
	);
};

export default ListBreakoutRoom;
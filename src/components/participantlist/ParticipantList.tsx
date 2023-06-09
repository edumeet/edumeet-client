import { Box, Typography, styled } from '@mui/material';
import { Flipped, Flipper } from 'react-flip-toolkit';
import {
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { breakoutRoomsSelector, inParentRoomSelector, parentParticipantListSelector } from '../../store/selectors';
import { permissions } from '../../utils/roles';
import {
	breakoutRoomsLabel,
	participantsLabel
} from '../translated/translatedComponents';
import ListMe from './ListMe';
import ListModerator from './ListModerator';
import ListPeer from './ListPeer';
import BreakoutModerator from '../breakoutrooms/BreakoutModerator';
import ListBreakoutRoom from '../breakoutrooms/ListBreakoutRoom';

const ParticipantListDiv = styled(Box)(({ theme }) => ({
	width: '100%',
	overflowY: 'auto',
	padding: theme.spacing(1),
}));

const ListHeader = styled(Typography)({
	fontWeight: 'bolder'
});

const ParticipantList = (): JSX.Element => {
	const breakoutsEnabled = useAppSelector((state) => state.room.breakoutsEnabled);
	const isModerator = usePermissionSelector(permissions.MODERATE_ROOM);
	const participants = useAppSelector(parentParticipantListSelector);
	const canCreateRooms = usePermissionSelector(permissions.CREATE_ROOM);
	const canChangeRoom = usePermissionSelector(permissions.CHANGE_ROOM);
	const rooms = useAppSelector(breakoutRoomsSelector);
	const inParent = useAppSelector(inParentRoomSelector);

	return (
		<ParticipantListDiv>
			{ isModerator && <ListModerator /> }
			{ (breakoutsEnabled && (rooms.length > 0 || canCreateRooms)) &&
				<>
					<ListHeader>
						{ breakoutRoomsLabel() }
					</ListHeader>
					{ canCreateRooms && <BreakoutModerator /> }
					<Flipper flipKey={rooms}>
						{rooms.map((room) => (
							<Flipped key={room.sessionId} flipId={room.sessionId}>
								<ListBreakoutRoom key={room.sessionId} room={room} canChangeRoom={canChangeRoom} canCreateRoom={canCreateRooms} isModerator={isModerator} />
							</Flipped>
						))}
					</Flipper>
				</>
			}
			{ (inParent || participants.length > 0) &&
				<>
					<ListHeader>
						{ participantsLabel() }
					</ListHeader>
					{ inParent && <ListMe /> }
					<Flipper flipKey={participants}>
						{ participants.map((peer) => (
							<Flipped key={peer.id} flipId={peer.id}>
								<ListPeer key={peer.id} peer={peer} isModerator={isModerator} />
							</Flipped>
						)) }
					</Flipper>
				</>
			}
		</ParticipantListDiv>
	);
};

export default ParticipantList;
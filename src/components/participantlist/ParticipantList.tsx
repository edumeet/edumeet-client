import { Box, Typography, styled } from '@mui/material';
import { Flipped, Flipper } from 'react-flip-toolkit';
import {
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { breakoutRoomsSelector, inParentRoomSelector, isMobileSelector, parentParticipantListSelector } from '../../store/selectors';
import { permissions } from '../../utils/roles';
import {
	breakoutRoomsLabel,
	participantsLabel,
	countdownTimerTitleLabel
} from '../translated/translatedComponents';
import ListMe from './ListMe';
import ListModerator from './ListModerator';
import ListPeer from './ListPeer';
import BreakoutModerator from '../breakoutrooms/BreakoutModerator';
import ListBreakoutRoom from '../breakoutrooms/ListBreakoutRoom';
import CountdownTimer from '../countdowntimer/CountdownTimer';
import edumeetConfig from '../../utils/edumeetConfig';
import { useState, useEffect } from 'react';
import { Peer } from '../../store/slices/peersSlice';
import DndContextWrapper from '../draganddrop/DragAndDropContextWrapper';
import { createPortal } from 'react-dom';
import { DragOverlay } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import PulsingBadge from '../pulsingbadge/PulsingBadge';
import DroppableWrapper from '../draganddrop/DroppableWrapper';
import DraggableWrapper from '../draganddrop/DraggableWrapper';

const ParticipantListDiv = styled(Box)(({ theme }) => ({
	width: '100%',
	overflowY: 'auto',
	padding: theme.spacing(1),
}));

const ListHeader = styled(Typography)({
	fontWeight: 'bolder'
});

const ParticipantList = (): React.JSX.Element => {
	const breakoutsEnabled = useAppSelector((state) => state.room.breakoutsEnabled);
	const isModerator = usePermissionSelector(permissions.MODERATE_ROOM);
	const isMobile = useAppSelector(isMobileSelector);
	const participants = useAppSelector(parentParticipantListSelector);
	const canCreateRooms = usePermissionSelector(permissions.CREATE_ROOM);
	const canChangeRoom = usePermissionSelector(permissions.CHANGE_ROOM);
	const rooms = useAppSelector(breakoutRoomsSelector);
	const inParent = useAppSelector(inParentRoomSelector);
	const [ draggedPeerIds, setDraggedPeerIds ] = useState<string[]>([]);
	const [ activePeer, setActivePeer ] = useState<Peer | null>(null);
	const [ showParticipantsList, setShowParticipantsList ] = useState<Peer[]>(participants);
	const [ dragOver, setDragOver ] = useState<string>('');

	// Ensure showParticipantsList is updated when new peer has joined/left
	useEffect(() => {
		const updatedList = activePeer ? participants.filter((peer) => !draggedPeerIds.includes(peer.id)) : participants;

		setShowParticipantsList(updatedList);
	}, [ participants ]);

	return (
		<ParticipantListDiv>
			{ isModerator && <>
				<ListModerator />
				{ edumeetConfig.countdownTimerEnabled && <>
					<ListHeader>
						{countdownTimerTitleLabel()}
					</ListHeader>
					<CountdownTimer />
				</> }
			</>
			}
			<DndContextWrapper setShowParticipantsList={setShowParticipantsList} setDragOver={setDragOver} draggedPeerIds={draggedPeerIds} setDraggedPeerIds={setDraggedPeerIds} activePeer={activePeer} setActivePeer={setActivePeer}>
				{ (breakoutsEnabled && (rooms.length > 0 || canCreateRooms)) &&
				<>
					<ListHeader>
						{ breakoutRoomsLabel() }
					</ListHeader>
					{ canCreateRooms && <BreakoutModerator /> }
					<Flipper flipKey={rooms}>
						{rooms.map((room) => (
							<DroppableWrapper key={room.sessionId} id={room.sessionId}>
								<ListBreakoutRoom key={room.sessionId} room={room} canChangeRoom={canChangeRoom} canCreateRoom={canCreateRooms} isModerator={isModerator} dragOver={dragOver} draggedPeerids={draggedPeerIds}/>
							</DroppableWrapper>
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
					<Flipper flipKey={showParticipantsList}>
						{ showParticipantsList.map((peer) => (
							<Flipped key={peer.id} flipId={peer.id}>
								<DraggableWrapper key={peer.id} id={peer.id} disabled={!isModerator || isMobile}>
									<ListPeer key={peer.id} peer={peer} isModerator={isModerator} />
								</DraggableWrapper>
							</Flipped>
						)) }
					</Flipper>
					{createPortal(
						<DragOverlay modifiers={[ restrictToWindowEdges ]}>
							{activePeer? (
								draggedPeerIds.length > 1 ? (
									<PulsingBadge color='primary' badgeContent={draggedPeerIds.length} sx={{ display: 'block' }}>
										<ListPeer peer={activePeer} isModerator={isModerator}/>
									</PulsingBadge>
								) : (
									<ListPeer peer={activePeer} isModerator={isModerator}/>
								)
							) : null}
						</DragOverlay>,
						document.body
					)}
				</>
				}
			</DndContextWrapper>
		</ParticipantListDiv>
	);
};

export default ParticipantList;
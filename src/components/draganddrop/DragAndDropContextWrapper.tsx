import React from 'react';
import { 
	DndContext,
	DragEndEvent,
	DragOverEvent,
	DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors
} from '@dnd-kit/core';
import { moveToBreakoutRoom } from '../../store/actions/roomActions';
import { Peer } from '../../store/slices/peersSlice';
import { roomSessionsActions } from '../../store/slices/roomSessionsSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { parentParticipantListSelector, currentRoomSessionSelector, peersArraySelector, roomSessionsArraySelector } from '../../store/selectors';

type DndContextWrapperProps = {
	children: React.ReactNode;
	// eslint-disable-next-line no-unused-vars
	setShowParticipantsList: (showParticipantsList: Peer[]) => void;
	// eslint-disable-next-line no-unused-vars
	setDragOver: (dragOver: string) => void;
	draggedPeerIds: string[];
	// eslint-disable-next-line no-unused-vars
	setDraggedPeerIds: (draggedPeerIds: string[]) => void;
	activePeer: Peer | null;
	// eslint-disable-next-line no-unused-vars
	setActivePeer: (activePeer: Peer | null) => void;
}

const DndContextWrapper = ({ children, setShowParticipantsList, setDragOver, draggedPeerIds, setDraggedPeerIds, activePeer, setActivePeer }: DndContextWrapperProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const participants = useAppSelector(parentParticipantListSelector);
	const currentRoom = useAppSelector(currentRoomSessionSelector);
	const totalPeers = useAppSelector(peersArraySelector);
	const allRooms = useAppSelector(roomSessionsArraySelector);
	const selectedPeersMap = new Map();

	for (let i = 0; i < allRooms.length; i++) {
		selectedPeersMap.set(allRooms[i].sessionId, allRooms[i].selectedPeers);
	}

	// Drag activation constraints
	const pointerSensor = useSensor(PointerSensor, {
		activationConstraint: {
			distance: 10, 
		}
	});
	const keyboardSensor = useSensor(KeyboardSensor);
	const sensors = useSensors(
		pointerSensor,
		keyboardSensor,
	);

	// Function to deselect all peers not being dragged
	const deselectPeers = (ids: string[]) => {
		selectedPeersMap.forEach((selectedPeers: string[], roomid: string) => { 
			selectedPeers.forEach((peerId) => {
				if (!ids.includes(peerId)) {
					dispatch(roomSessionsActions.deselectPeer({ sessionId: roomid, peerId: peerId }));
				} 
			});
		});
	};

	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		const activeId = active.id as string;
		const draggedPeer = totalPeers.find((peer) => peer.id == activeId);

		// Ensure we are dragging a peer
		if (!draggedPeer) {
			return;
		}

		const dragging = !currentRoom.selectedPeers.includes(activeId) ? [ activeId ] : [ ...new Set([ ...currentRoom.selectedPeers, activeId ]) ];
		const newList = participants.filter((peer) => !dragging.includes(peer.id));
		const deselect = !Array.from(selectedPeersMap.values()).flat()
			.every((peerId) => dragging.includes(peerId));

		// Deselect peers if there are selected peers not being dragged
		if (deselect) {
			deselectPeers(dragging);
		}

		setActivePeer(draggedPeer);
		setDraggedPeerIds(dragging);
		setShowParticipantsList(newList);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { over } = event;

		// Ensure over some droppable component
		if (!over) {
			setShowParticipantsList(participants);
			setDraggedPeerIds([]);
			setActivePeer(null);

			return;
		}

		const roomId = over.id as string;

		// Drop peer if peer is over a new breakout room
		if (roomId !== activePeer?.sessionId && draggedPeerIds) {
			draggedPeerIds.forEach((peerId) => {
				dispatch(moveToBreakoutRoom(peerId, roomId));
			});
		}

		// Reset when drag has ended
		// setShowParticipantsList(participants); // Uncomment if necessary but will produce a visual glitch
		setDraggedPeerIds([]);
		setActivePeer(null);
		setDragOver('');
	};

	const handleDragCancel = () => {
		// Reset all when drag is cancelled
		setShowParticipantsList(participants);
		setDraggedPeerIds([]);
		setActivePeer(null);
		setDragOver('');
	};

	const handleDragOver = (event: DragOverEvent) => {
		const { over } = event;

		if (!over) {
			setDragOver('');

			return;
		}

		setDragOver(over.id as string);
	};

	return (
		<DndContext
			sensors={sensors} 			
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd} 
			onDragCancel={handleDragCancel}
			onDragOver={handleDragOver}
		>
			{children}
		</DndContext>
	);
};

export default DndContextWrapper;
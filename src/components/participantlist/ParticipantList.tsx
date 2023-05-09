import { styled } from '@mui/material';
import { Flipped, Flipper } from 'react-flip-toolkit';
import {
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { participantListSelector } from '../../store/selectors';
import { permissions } from '../../utils/roles';
import {
	meLabel,
	moderatorActionsLabel,
	participantsLabel
} from '../translated/translatedComponents';
import ListMe from './ListMe';
import ListModerator from './ListModerator';
import ListPeer from './ListPeer';
import BreakoutModerator from '../breakoutrooms/BreakoutModerator';
import ListBreakoutRoom from '../breakoutrooms/ListBreakoutRoom';

const ParticipantListDiv = styled('div')(({ theme }) => ({
	width: '100%',
	overflowY: 'auto',
	padding: theme.spacing(1)
}));

const ListUl = styled('ul')(({ theme }) => ({
	listStyleType: 'none',
	padding: theme.spacing(1),
	boxShadow: '0 2px 5px 2px rgba(0, 0, 0, 0.2)',
	backgroundColor: 'rgba(255, 255, 255, 1)'
}));

const ListHeaderLi = styled('li')({
	fontWeight: 'bolder'
});

const ListItemLi = styled('li')({
	width: '100%',
	overflow: 'hidden',
	cursor: 'pointer',
	'&:not(:last-child)': {
		borderBottom: '1px solid #CBCBCB'
	}
});

const ParticipantList = (): JSX.Element => {
	const isModerator = usePermissionSelector(permissions.MODERATE_ROOM);
	const participants = useAppSelector(participantListSelector);
	const createRooms = usePermissionSelector(permissions.CREATE_ROOM);
	const changeRoom = usePermissionSelector(permissions.CHANGE_ROOM);
	const rooms = useAppSelector((state) => state.breakoutRooms);

	return (
		<ParticipantListDiv>
			{ isModerator &&
				<ListUl>
					<ListHeaderLi>
						{ moderatorActionsLabel() }
					</ListHeaderLi>
					<ListModerator />
				</ListUl>
			}
			<ListUl>
				<ListHeaderLi>
					{ meLabel()}
				</ListHeaderLi>
				<ListMe />
			</ListUl>
			<ListUl>
				<ListHeaderLi>
					{ participantsLabel() }
				</ListHeaderLi>
				<Flipper flipKey={participants}>
					{ participants.map((peer) => (
						<Flipped key={peer.id} flipId={peer.id}>
							<ListItemLi key={peer.id}>
								<ListPeer peer={peer} isModerator={isModerator} />
							</ListItemLi>
						</Flipped>
					)) }
				</Flipper>
			</ListUl>
			{createRooms &&
				<ListUl>
					<ListHeaderLi>
						{moderatorActionsLabel()}
					</ListHeaderLi>
					<BreakoutModerator />
				</ListUl>
			}
			<ListUl>
				<ListHeaderLi>
					{participantsLabel()}
				</ListHeaderLi>
				<Flipper flipKey={rooms}>
					{rooms.map((room) => (
						<Flipped key={room.sessionId} flipId={room.sessionId}>
							<ListItemLi key={room.sessionId}>
								<ListBreakoutRoom room={room} changeRoom={changeRoom} createRoom={createRooms} />
							</ListItemLi>
						</Flipped>
					))}
				</Flipper>
			</ListUl>

		</ParticipantListDiv>
	);
};

export default ParticipantList;
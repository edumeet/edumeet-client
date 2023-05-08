import { styled } from '@mui/material';
import { Flipped, Flipper } from 'react-flip-toolkit';
import {
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import { permissions } from '../../utils/roles';
import {
	moderatorActionsLabel,
	participantsLabel
} from '../translated/translatedComponents';
import BreakoutModerator from './BreakoutModerator';
import ListBreakoutRoom from './ListBreakoutRoom';

const BreakoutRoomsDiv = styled('div')(({ theme }) => ({
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

const BreakoutRooms = (): JSX.Element => {
	const createRooms = usePermissionSelector(permissions.CREATE_ROOM);
	const changeRoom = usePermissionSelector(permissions.CHANGE_ROOM);
	const rooms = useAppSelector((state) => state.breakoutRooms);

	return (
		<BreakoutRoomsDiv>
			{ createRooms &&
				<ListUl>
					<ListHeaderLi>
						{ moderatorActionsLabel() }
					</ListHeaderLi>
					<BreakoutModerator />
				</ListUl>
			}
			<ListUl>
				<ListHeaderLi>
					{ participantsLabel() }
				</ListHeaderLi>
				<Flipper flipKey={rooms}>
					{ rooms.map((room) => (
						<Flipped key={room.sessionId} flipId={room.sessionId}>
							<ListItemLi key={room.sessionId}>
								<ListBreakoutRoom room={room} changeRoom={changeRoom} createRoom={createRooms} />
							</ListItemLi>
						</Flipped>
					)) }
				</Flipper>
			</ListUl>
		</BreakoutRoomsDiv>
	);
};

export default BreakoutRooms;
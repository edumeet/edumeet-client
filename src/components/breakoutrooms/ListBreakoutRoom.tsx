import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, styled } from '@mui/material';
import { useAppSelector, usePeersInSession } from '../../store/hooks';
import { RoomSession } from '../../store/slices/roomSessionsSlice';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Flipped, Flipper } from 'react-flip-toolkit';
import ListPeer from '../participantlist/ListPeer';
import LeaveBreakoutRoomButton from '../textbuttons/LeaveBreakoutRoomButton';
import JoinBreakoutRoomButton from '../textbuttons/JoinBreakoutRoomButton';
import EjectBreakoutRoomButton from '../textbuttons/EjectBreakoutRoomButton';
import RemoveBreakoutRoomButton from '../textbuttons/RemoveBreakoutRoomButton';
import ListMe from '../participantlist/ListMe';
import { useState } from 'react';

interface BreakoutRoomProps {
	room: RoomSession;
	canChangeRoom: boolean;
	canCreateRoom: boolean;
	isModerator: boolean;
}

interface AccordionProps {
	insession: number;
}

const StyledAccordion = styled(Accordion)<AccordionProps>(({
	theme,
	insession
}) => ({
	backgroundColor: theme.chatColor,
	...(insession && {
		backgroundColor: 'lightgray',
	})
}));

const BreakoutRoomChip = styled(Chip)(({ theme }) => ({
	marginRight: theme.spacing(1),
}));

const BreakoutRoomAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
	margin: 0,
	paddingTop: 0,
	paddingBottom: theme.spacing(1),
	paddingRight: theme.spacing(1),
	paddingLeft: theme.spacing(1),
}));

const BreakoutRoomNameDiv = styled(Box)({
	display: 'flex',
	flexGrow: 1,
	justifyContent: 'start',
	wordBreak: 'break-all'
});

const BreakoutRoomButtonDiv = styled(Box)(({ theme }) => ({
	display: 'flex',
	flexGrow: 1,
	justifyContent: 'end',
	gap: theme.spacing(1),
}));

const ExpandedBreakoutRoomButtonDiv = styled(Box)(({ theme }) => ({
	display: 'flex',
	flexGrow: 1,
	justifyContent: 'center',
	gap: theme.spacing(1),
	marginTop: theme.spacing(1),
}));

const ListBreakoutRoom = ({
	room,
	canChangeRoom,
	canCreateRoom,
	isModerator,
}: BreakoutRoomProps): JSX.Element => {
	const [ expanded, setExpanded ] = useState(false);
	const sessionId = useAppSelector((state) => state.me.sessionId);
	const inSession = room.sessionId === sessionId;
	const participants = usePeersInSession(room.sessionId);

	return (
		<StyledAccordion
			TransitionProps={{ unmountOnExit: true }}
			expanded={inSession || expanded}
			onChange={(_, exp) => setExpanded(exp)}
			insession={inSession ? 1 : 0}
		>
			<AccordionSummary
				expandIcon={<ExpandMoreIcon />}
				aria-controls={room.name}
			>
				<BreakoutRoomNameDiv>
					<BreakoutRoomChip label={participants.length + (inSession ? 1 : 0)} size='small' />
					{ room.name }
				</BreakoutRoomNameDiv>
				{ canChangeRoom && (inSession ? (
					<BreakoutRoomButtonDiv>
						<LeaveBreakoutRoomButton />
					</BreakoutRoomButtonDiv>
				) : (
					<BreakoutRoomButtonDiv>
						<JoinBreakoutRoomButton sessionId={room.sessionId} />
					</BreakoutRoomButtonDiv>
				))}
			</AccordionSummary>
			<BreakoutRoomAccordionDetails>
				{ inSession && <ListMe /> }
				{ participants.length > 0 &&
					<Flipper flipKey={participants}>
						{ participants.map((peer) => (
							<Flipped key={peer.id} flipId={peer.id}>
								<ListPeer key={peer.id} peer={peer} isModerator={isModerator} />
							</Flipped>
						)) }
					</Flipper>
				}
				{ canCreateRoom &&
					<ExpandedBreakoutRoomButtonDiv>
						<EjectBreakoutRoomButton sessionId={room.sessionId} />
						<RemoveBreakoutRoomButton sessionId={room.sessionId} />
					</ExpandedBreakoutRoomButtonDiv>
				}
			</BreakoutRoomAccordionDetails>
		</StyledAccordion>
	);
};

export default ListBreakoutRoom;
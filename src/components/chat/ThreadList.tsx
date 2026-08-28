import { Box, IconButton, Paper, styled, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { directMessageThreadsSelector } from '../../store/selectors';
import { directMessagesActions, DirectMessageThread } from '../../store/slices/directMessagesSlice';
import { uiActions } from '../../store/slices/uiSlice';
import { directMessagesLabel, hideConversationLabel, meLabel } from '../translated/translatedComponents';

const ThreadListDiv = styled(Box)(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	margin: theme.spacing(1),
	marginBottom: 0,
	flexShrink: 0,
}));

const ThreadListHeader = styled(Box)({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	cursor: 'pointer',
});

const ThreadRows = styled(Box)({
	maxHeight: '9.5rem',
	overflowY: 'auto',
});

const ThreadDiv = styled(Paper)(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	gap: theme.spacing(1),
	padding: theme.spacing(0.5),
	marginTop: theme.spacing(0.5),
	cursor: 'pointer',
	backgroundColor: theme.sideContentItemColor,
	'& .hideThread': {
		visibility: 'hidden',
	},
	'&:hover .hideThread': {
		visibility: 'visible',
	},
}));

const UnreadCount = styled(Box)(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minWidth: '1.25rem',
	height: '1.25rem',
	paddingLeft: theme.spacing(0.5),
	paddingRight: theme.spacing(0.5),
	borderRadius: '0.625rem',
	backgroundColor: theme.palette.primary.main,
	color: theme.palette.primary.contrastText,
	fontSize: theme.typography.caption.fontSize,
}));

const ThreadText = styled(Box)({
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	minWidth: 0,
});

const EllipsisTypography = styled(Typography)({
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
});

// The messages render as markdown, so the row preview has to show the rendered
// intent rather than the source.
const previewText = (text = ''): string => text
	.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
	.replace(/[*_~`>#]/g, '')
	.replace(/\s+/g, ' ')
	.trim();

const ThreadRow = ({ thread }: { thread: DirectMessageThread }): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const meId = useAppSelector((state) => state.me.id);
	const lastMessage = thread.messages[thread.messages.length - 1];
	const preview = lastMessage &&
		`${lastMessage.peerId === meId ? `${meLabel()}: ` : ''}${previewText(lastMessage.text)}`;

	return (
		<ThreadDiv onClick={() => dispatch(uiActions.setUi({ activeChatThread: thread.peerId }))}>
			<ThreadText>
				<EllipsisTypography variant='body2'>{ thread.displayName }</EllipsisTypography>
				<EllipsisTypography variant='caption' color='text.disabled'>{ preview }</EllipsisTypography>
			</ThreadText>
			{ thread.unread > 0 && <UnreadCount>{ thread.unread }</UnreadCount> }
			<Tooltip title={hideConversationLabel()}>
				<IconButton
					className='hideThread'
					aria-label={hideConversationLabel()}
					size='small'
					onClick={(event) => {
						event.stopPropagation();
						dispatch(directMessagesActions.hideThread(thread.peerId));
					}}
				>
					<CloseIcon fontSize='small' />
				</IconButton>
			</Tooltip>
		</ThreadDiv>
	);
};

const ThreadList = (): React.JSX.Element | null => {
	const threads = useAppSelector(directMessageThreadsSelector);
	const [ collapsed, setCollapsed ] = useState(false);

	if (!threads.length) return null;

	return (
		<ThreadListDiv>
			<ThreadListHeader onClick={() => setCollapsed(!collapsed)}>
				<Typography variant='caption' color='text.disabled'>{ directMessagesLabel() }</Typography>
				<IconButton size='small' aria-label={directMessagesLabel()}>
					{ collapsed ? <ExpandMoreIcon fontSize='small' /> : <ExpandLessIcon fontSize='small' /> }
				</IconButton>
			</ThreadListHeader>
			{ !collapsed &&
				<ThreadRows>
					{ threads.map((thread) => <ThreadRow key={thread.peerId} thread={thread} />) }
				</ThreadRows>
			}
		</ThreadListDiv>
	);
};

export default ThreadList;

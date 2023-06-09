import { AppBar, Toolbar, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useAppSelector, usePermissionSelector } from '../../store/hooks';
import { lobbyPeersLengthSelector, roomSessionCreationTimestampSelector } from '../../store/selectors';
import edumeetConfig from '../../utils/edumeetConfig';
import { permissions } from '../../utils/roles';
import LobbyButton from '../controlbuttons/LobbyButton';
import LockButton from '../controlbuttons/LockButton';
import FullscreenButton from '../controlbuttons/FullscreenButton';
import LoginButton from '../controlbuttons/LoginButton';
import SettingsButton from '../controlbuttons/SettingsButton';
import LeaveButton from '../textbuttons/LeaveButton';
import TranscriptionButton from '../controlbuttons/TranscriptionButton';
import AccessTime from '@mui/icons-material/AccessTime';
import { formatDuration } from '../../utils/formatDuration';

interface TopBarProps {
	fullscreenEnabled: boolean;
	fullscreen: boolean;
	onFullscreen: () => void;
}

const StyledAppBar = styled(AppBar)(({ theme }) => ({
	backgroundColor: theme.appBarColor,
	...(theme.appBarFloating && {
		top: 4,
		left: 4,
		width: 'calc(100% - 8px)',
		borderRadius: 10,
	}),
	height: 48,
	'& .MuiToolbar-root': {
		paddingLeft: theme.spacing(1),
		paddingRight: theme.spacing(1),
	}
}));

const LogoImg = styled('img')(({ theme }) => ({
	marginLeft: theme.spacing(1),
	marginRight: theme.spacing(1),
	maxWidth: 200,
	maxHeight: 32,
}));

interface TopBarDivProps {
	gap?: number;
	grow?: number;
}

const TopBarDiv = styled('div')<TopBarDivProps>(({ theme, gap = 0, grow = 0 }) => ({
	display: 'flex',
	marginRight: theme.spacing(2),
	gap: theme.spacing(gap),
	flexGrow: grow
}));

const TopBar = ({
	fullscreenEnabled,
	fullscreen,
	onFullscreen
}: TopBarProps): JSX.Element => {
	const logo = useAppSelector((state) => state.room.logo);
	const canLock = usePermissionSelector(permissions.CHANGE_ROOM_LOCK);
	const canPromote = usePermissionSelector(permissions.PROMOTE_PEER);
	const canTranscribe = useAppSelector((state) => state.me.canTranscribe);
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const lobbyPeersLength = useAppSelector(lobbyPeersLengthSelector);
	const roomCreationTimestamp = useAppSelector(roomSessionCreationTimestampSelector);
	const [ meetingDuration, setMeetingDuration ] = useState<number>(0);

	useEffect(() => {
		if (roomCreationTimestamp) {
			const interval = 1000;
			let expected = Date.now() + interval;

			const driftAwareTimer = () => {
				const dt = Date.now() - expected;

				expected += interval;
				setMeetingDuration(Date.now() - roomCreationTimestamp);
				setTimeout(driftAwareTimer, Math.max(0, interval - dt));
			};

			const computeDuration = setTimeout(driftAwareTimer, interval);

			return () => clearTimeout(computeDuration);
		}
	}, []);

	return (
		<StyledAppBar position='fixed'>
			<Toolbar variant='dense'>
				{ logo ?
					<LogoImg alt='Logo' src={logo}/> :
					<Typography variant='h6' noWrap color='inherit'>
						{edumeetConfig.title}
					</Typography>
				}
				<TopBarDiv gap={1}>
					<AccessTime />
					<Typography>{ formatDuration(meetingDuration) }</Typography>
				</TopBarDiv>
				<TopBarDiv grow={1} />
				<TopBarDiv>
					{ canTranscribe && <TranscriptionButton type='iconbutton' /> }
					{ fullscreenEnabled && <FullscreenButton type='iconbutton' fullscreen={fullscreen} onClick={onFullscreen} /> }
					<SettingsButton type='iconbutton' />
					{ canLock && <LockButton type='iconbutton' /> }
					{ canPromote && lobbyPeersLength > 0 && <LobbyButton type='iconbutton' /> }
					{ loginEnabled && <LoginButton type='iconbutton' /> }
				</TopBarDiv>
				<LeaveButton />
			</Toolbar>
		</StyledAppBar>
	);
};

export default TopBar;
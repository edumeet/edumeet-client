import { AppBar, Chip, Toolbar, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useAppSelector, usePermissionSelector } from '../../store/hooks';
import { lobbyPeersLengthSelector, roomSessionCreationTimestampSelector, someoneIsRecordingSelector } from '../../store/selectors';
import edumeetConfig from '../../utils/edumeetConfig';
import { permissions } from '../../utils/roles';
import LobbyButton from '../controlbuttons/LobbyButton';
import LockButton from '../controlbuttons/LockButton';
import FullscreenButton from '../controlbuttons/FullscreenButton';
import LoginButton from '../controlbuttons/LoginButton';
import SettingsButton from '../controlbuttons/SettingsButton';
import LeaveButton from '../textbuttons/LeaveButton';
import { formatDuration } from '../../utils/formatDuration';
import LogoutButton from '../controlbuttons/LogoutButton';
import RecordIcon from '../recordicon/RecordIcon';

interface TopBarProps {
	fullscreenEnabled: boolean;
	fullscreen: boolean;
	onFullscreen: () => void;
}

const StyledChip = styled(Chip)({
	color: 'white',
	backgroundColor: 'rgba(128, 128, 128, 0.5)',
});

const StyledAppBar = styled(AppBar)(({ theme }) => ({
	backgroundColor: theme.appBarColor,
	...(theme.appBarFloating && {
		top: 4,
		left: 4,
		width: 'calc(100% - 8px)',
		borderRadius: theme.roundedness,
	}),
	'& .MuiToolbar-root': {
		minHeight: 40,
		paddingLeft: theme.spacing(1),
		paddingRight: theme.spacing(1),
	}
}));

const LogoImg = styled('img')(({ theme }) => ({
	display: 'none',
	marginLeft: theme.spacing(1),
	marginRight: theme.spacing(1),
	maxWidth: 200,
	maxHeight: 32,
	[theme.breakpoints.up('sm')]: {
		display: 'block'
	}
}));

interface TopBarDivProps {
	gap?: number;
	grow?: number;
	marginRight?: number;
	marginLeft?: number;
}

const TopBarDiv = styled('div')<TopBarDivProps>(({ theme, gap = 0, grow = 0, marginRight = 0, marginLeft = 0 }) => ({
	display: 'flex',
	marginRight: theme.spacing(marginRight),
	marginLeft: theme.spacing(marginLeft),
	gap: theme.spacing(gap),
	flexGrow: grow,
	alignItems: 'center',
	justifyContent: 'center'
}));

const TopBar = ({ fullscreenEnabled, fullscreen, onFullscreen }: TopBarProps): React.JSX.Element => {
	const logo = useAppSelector((state) => state.room.logo);
	const canLock = usePermissionSelector(permissions.CHANGE_ROOM_LOCK);
	const canPromote = usePermissionSelector(permissions.PROMOTE_PEER);
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const lobbyPeersLength = useAppSelector(lobbyPeersLengthSelector);
	const roomCreationTimestamp = useAppSelector(roomSessionCreationTimestampSelector);
	const [ meetingDuration, setMeetingDuration ] = useState<number>(0);
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const someoneIsRecording = useAppSelector(someoneIsRecordingSelector);

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
				<TopBarDiv marginLeft={1}>
					{ logo ?
						<LogoImg alt='Logo' src={ logo }/>
						:
						<Typography variant='h6' noWrap color='inherit'>
							{ edumeetConfig.title }
						</Typography>
					}
				</TopBarDiv>
				<TopBarDiv grow={1} />
				<TopBarDiv marginRight={1}>
					{ someoneIsRecording && <RecordIcon color='error' /> }
					{ fullscreenEnabled && <FullscreenButton type='iconbutton' fullscreen={fullscreen} onClick={onFullscreen} /> }
					<SettingsButton type='iconbutton' />
					{ canLock && <LockButton type='iconbutton' /> }
					{ canPromote && lobbyPeersLength > 0 && <LobbyButton type='iconbutton' /> }
					{ loginEnabled && (loggedIn ? <LogoutButton type='iconbutton' /> : <LoginButton type='iconbutton' />) }
				</TopBarDiv>
				<TopBarDiv marginRight={2}>
					<StyledChip size='small' label={ formatDuration(meetingDuration) } />
				</TopBarDiv>
				<LeaveButton />
			</Toolbar>
		</StyledAppBar>
	);
};

export default TopBar;

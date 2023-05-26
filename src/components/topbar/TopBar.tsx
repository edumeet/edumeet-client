import {
	AppBar,
	IconButton,
	Toolbar,
	Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Fragment, useEffect, useState } from 'react';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import {
	fullscreenConsumerSelector,
	lobbyPeersLengthSelector,
	roomSessionCreationTimestampSelector,
	unreadSelector
} from '../../store/selectors';
import { drawerActions } from '../../store/slices/drawerSlice';
import MenuIcon from '@mui/icons-material/Menu';
import MoreIcon from '@mui/icons-material/MoreVert';
import edumeetConfig from '../../utils/edumeetConfig';
import { openDrawerLabel } from '../translated/translatedComponents';
import { permissions } from '../../utils/roles';
import FloatingMenu from '../floatingmenu/FloatingMenu';
import Login from '../menuitems/Login';
import Lock from '../menuitems/Lock';
import Settings from '../menuitems/Settings';
import Participants from '../menuitems/Participants';
import Fullscreen from '../menuitems/Fullscreen';
import PulsingBadge from '../pulsingbadge/PulsingBadge';
import LobbyButton from '../controlbuttons/LobbyButton';
import LockButton from '../controlbuttons/LockButton';
import FullscreenButton from '../controlbuttons/FullscreenButton';
import ParticipantsButton from '../controlbuttons/ParticipantsButton';
import LoginButton from '../controlbuttons/LoginButton';
import SettingsButton from '../controlbuttons/SettingsButton';
import FilesharingButton from '../controlbuttons/FilesharingButton';
import MicButton from '../controlbuttons/MicButton';
import WebcamButton from '../controlbuttons/WebcamButton';
import RecordButton from '../controlbuttons/RecordButton';
import LeaveButton from '../textbuttons/LeaveButton';
import ScreenshareButton from '../controlbuttons/ScreenshareButton';
import ExtraVideoButton from '../controlbuttons/ExtraVideoButton';
import ExtraVideo from '../menuitems/ExtraVideo';
import Filesharing from '../menuitems/Filesharing';
import TranscriptionButton from '../controlbuttons/TranscriptionButton';
import Transcription from '../menuitems/Transcription';
import { AccessTime } from '@mui/icons-material';
import Help from '../menuitems/Help';
import HelpButton from '../controlbuttons/HelpButton';

interface TopBarProps {
	fullscreenEnabled: boolean;
	fullscreen: boolean;
	onFullscreen: () => void;
}

const StyledAppBar = styled(AppBar)(({ theme }) => ({
	backgroundColor: theme.appBarColor,
	height: '64px',
}));

const LogoImg = styled('img')(({ theme }) => ({
	display: 'none',
	marginLeft: 20,
	maxWidth: theme.spacing(12),
	maxHeight: theme.spacing(6),
	[theme.breakpoints.up('sm')]: {
		display: 'block'
	}
}));

const DurationDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	padding: theme.spacing(0, 2),
	'.MuiTypography-root': {
		marginLeft: theme.spacing(1),
	}
}));

const GrowingDiv = styled('div')({
	display: 'flex',
	justifyContent: 'center',
	flexGrow: 1
});

const DividerDiv = styled('div')(({ theme }) => ({
	marginLeft: theme.spacing(3)
}));

const DesktopDiv = styled('div')(({ theme }) => ({
	display: 'none',
	[theme.breakpoints.up('md')]: {
		display: 'flex'
	}
}));

const MobileDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	[theme.breakpoints.up('md')]: {
		display: 'none'
	}
}));

const TopBar = ({
	fullscreenEnabled,
	fullscreen,
	onFullscreen
}: TopBarProps): JSX.Element => {
	const logo = useAppSelector((state) => state.room.logo);
	const dispatch = useAppDispatch();
	const filesharingEnabled = useAppSelector((state) => state.room.filesharingEnabled);
	const localRecordingEnabled = useAppSelector((state) => state.room.localRecordingEnabled);
	const canLock = usePermissionSelector(permissions.CHANGE_ROOM_LOCK);
	const canPromote = usePermissionSelector(permissions.PROMOTE_PEER);
	const canRecord = useAppSelector((state) => state.me.canRecord);
	const canTranscribe = useAppSelector((state) => state.me.canTranscribe);
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const audioOnly = useAppSelector((state) => state.settings.audioOnly);
	const fullscreenConsumer = useAppSelector(fullscreenConsumerSelector);
	const unread = useAppSelector(unreadSelector);
	const lobbyPeersLength = useAppSelector(lobbyPeersLengthSelector);

	const [ mobileMoreAnchorEl, setMobileMoreAnchorEl ] = useState<HTMLElement | null>();

	const handleMenuClose = () => {
		setMobileMoreAnchorEl(null);
	};

	const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

	const roomCreationTimestamp = useAppSelector(roomSessionCreationTimestampSelector);
	const [ meetingDuration, setMeetingDuration ] = useState<number>(0);

	const formatDuration = (duration: number) => {
		const durationInSeconds = Math.round(duration / 1000);

		const hours = Math.floor(durationInSeconds / 3600);
		const minutes = Math.floor((durationInSeconds - (hours * 3600)) / 60);
		const seconds = durationInSeconds - (minutes * 60) - (hours * 3600);

		const formattedElements: Array<string> = new Array(3);

		formattedElements[0] = seconds < 10 ? '0'.concat(seconds.toString()) : seconds.toString();
		formattedElements[1] = (minutes < 10 ? 
			'0'.concat(minutes.toString()) : minutes.toString()
		).concat(':');
		formattedElements[2] = hours.toString().concat(':');

		const formattedString = (
			(hours ? formattedElements[2] : '') + formattedElements[1] + formattedElements[0]
		);

		return formattedString;
	};

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
		<Fragment>
			<StyledAppBar position='fixed'>
				<Toolbar sx={{
					margin: 'auto 0'
				}}>
					<PulsingBadge
						color='secondary'
						badgeContent={unread}
						onClick={() => dispatch(drawerActions.toggle())}
					>
						<IconButton
							color='inherit'
							aria-label={openDrawerLabel()}
							size='small'
						>
							<MenuIcon />
						</IconButton>
					</PulsingBadge>
					{ logo ?
						<LogoImg alt='Logo' src={logo}/> :
						<Typography variant='h6' noWrap color='inherit'>
							{edumeetConfig.title}
						</Typography>
					}
					<DurationDiv>
						<AccessTime />
						<Typography>{ formatDuration(meetingDuration) }</Typography>
					</DurationDiv>
					<GrowingDiv>
						{ Boolean(fullscreenConsumer) &&
							<>
								<MicButton
									type='iconbutton'
									offColor='error'
									disabledColor='default'
								/>
								<WebcamButton
									type='iconbutton'
									offColor='error'
									disabledColor='default'
								/>
								<ScreenshareButton type='iconbutton' />
							</>
						}
					</GrowingDiv>
					<DesktopDiv>
						<HelpButton type='iconbutton' />
						{ canTranscribe && <TranscriptionButton type='iconbutton' /> }
						{ filesharingEnabled && <FilesharingButton type='iconbutton' /> }
						{ !audioOnly && <ExtraVideoButton type='iconbutton' />}
						{ localRecordingEnabled && canRecord && <RecordButton type='iconbutton' /> }
						{ fullscreenEnabled &&
							<FullscreenButton
								type='iconbutton'
								fullscreen={fullscreen}
								onClick={onFullscreen}
							/>
						}
						<ParticipantsButton type='iconbutton' />
						<SettingsButton type='iconbutton' />
						<LockButton type='iconbutton' />
						{ canPromote && lobbyPeersLength > 0 && <LobbyButton type='iconbutton' /> }
						{ loginEnabled && <LoginButton type='iconbutton' /> }
					</DesktopDiv>
					<MobileDiv>
						{ localRecordingEnabled && canRecord && <RecordButton type='iconbutton' /> }
						{ canPromote && lobbyPeersLength > 0 && <LobbyButton type='iconbutton' /> }
						<IconButton
							aria-haspopup
							onClick={(event) => {
								setMobileMoreAnchorEl(event.currentTarget);
							}}
							color='inherit'
							size='small'
						>
							<MoreIcon />
						</IconButton>
					</MobileDiv>
					<DividerDiv />
					<LeaveButton />
				</Toolbar>
			</StyledAppBar>
			<FloatingMenu
				anchorEl={mobileMoreAnchorEl}
				open={isMobileMenuOpen}
				onClose={handleMenuClose}
			>
				{ loginEnabled && <Login onClick={handleMenuClose} /> }
				{ canLock && <Lock onClick={handleMenuClose} /> }
				<Settings onClick={handleMenuClose} />
				<Participants onClick={handleMenuClose} />
				<Fullscreen onClick={handleMenuClose} />
				<ExtraVideo onClick={handleMenuClose} />
				{ filesharingEnabled && <Filesharing onClick={handleMenuClose} /> }
				{ canTranscribe && <Transcription onClick={handleMenuClose} /> }
				<Help onClick={handleMenuClose} />
			</FloatingMenu>
		</Fragment>
	);
};

export default TopBar;
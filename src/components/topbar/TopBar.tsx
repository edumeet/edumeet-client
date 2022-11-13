import {
	AppBar,
	IconButton,
	Toolbar,
	Typography
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Fragment, useState } from 'react';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import {
	fullscreenConsumerSelector,
	lobbyPeersLengthSelector,
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

interface TopBarProps {
	fullscreenEnabled: boolean;
	fullscreen: boolean;
	onFullscreen: () => void;
}

const StyledAppBar = styled(AppBar)(({ theme }) => ({
	backgroundColor: theme.appBarColor
}));

const LogoImg = styled('img')(({ theme }) => ({
	display: 'none',
	marginLeft: 20,
	[theme.breakpoints.up('sm')]: {
		display: 'block'
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
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const canLock = usePermissionSelector(permissions.CHANGE_ROOM_LOCK);
	const canPromote = usePermissionSelector(permissions.PROMOTE_PEER);
	const canRecord = useAppSelector((state) => state.me.canRecord);
	const canTranscribe = useAppSelector((state) => state.me.canTranscribe);
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const fullscreenConsumer = useAppSelector(fullscreenConsumerSelector);
	const unread = useAppSelector(unreadSelector);
	const lobbyPeersLength = useAppSelector(lobbyPeersLengthSelector);

	const [ mobileMoreAnchorEl, setMobileMoreAnchorEl ] = useState<HTMLElement | null>();

	const handleMenuClose = () => {
		setMobileMoreAnchorEl(null);
	};

	const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

	return (
		<Fragment>
			<StyledAppBar position='fixed'>
				<Toolbar>
					<PulsingBadge
						color='secondary'
						badgeContent={unread}
						onClick={() => dispatch(drawerActions.toggle())}
					>
						<IconButton
							color='inherit'
							aria-label={openDrawerLabel()}
						>
							<MenuIcon />
						</IconButton>
					</PulsingBadge>
					{ theme.logo ?
						<LogoImg alt='Logo' src={theme.logo}/> :
						<Typography variant='h6' noWrap color='inherit'>
							{edumeetConfig.title}
						</Typography>
					}
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
						{ canTranscribe && <TranscriptionButton type='iconbutton' /> }
						<FilesharingButton type='iconbutton' />
						<ExtraVideoButton type='iconbutton' />
						{ canRecord && <RecordButton type='iconbutton' /> }
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
						{ canRecord && <RecordButton type='iconbutton' /> }
						{ canPromote && lobbyPeersLength > 0 && <LobbyButton type='iconbutton' /> }
						<IconButton
							aria-haspopup
							onClick={(event) => {
								setMobileMoreAnchorEl(event.currentTarget);
							}}
							color='inherit'
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
				<Filesharing onClick={handleMenuClose} />
				{ canTranscribe && <Transcription onClick={handleMenuClose} /> }
			</FloatingMenu>
		</Fragment>
	);
};

export default TopBar;
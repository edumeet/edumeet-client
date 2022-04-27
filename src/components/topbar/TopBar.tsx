import {
	AppBar,
	Button,
	IconButton,
	Toolbar,
	Typography
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Fragment, useState } from 'react';
import { useIntl } from 'react-intl';
import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import {
	filesLengthSelector,
	lobbyPeersLengthSelector,
	unreadSelector
} from '../../store/selectors';
import { drawerActions } from '../../store/slices/drawerSlice';
import MenuIcon from '@mui/icons-material/Menu';
import MoreIcon from '@mui/icons-material/More';
import edumeetConfig from '../../utils/edumeetConfig';
import {
	leaveLabel,
	LeaveMessage,
	openDrawerLabel,
} from '../translated/translatedComponents';
import { permissions } from '../../utils/roles';
import { uiActions } from '../../store/slices/uiSlice';
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

interface TopBarProps {
	fullscreenEnabled: boolean;
	fullscreen: boolean;
	onFullscreen: () => void;
}

const LogoImg = styled('img')(({ theme }) => ({
	display: 'none',
	marginLeft: 20,
	[theme.breakpoints.up('sm')]: {
		display: 'block'
	}
}));

const GrowingDiv = styled('div')({
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
	const intl = useIntl();
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const canLock = usePermissionSelector(permissions.CHANGE_ROOM_LOCK);

	const leaveOpen = useAppSelector((state) => state.ui.leaveOpen);
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const permanentTopBar = useAppSelector((state) => state.settings.permanentTopBar);
	const drawerOverlayed = useAppSelector((state) => state.settings.drawerOverlayed);
	const platform = useAppSelector((state) => state.me.browser.platform);
	const drawerOpen = useAppSelector((state) => state.drawer.open);
	const unread = useAppSelector(unreadSelector);
	const lobbyPeersLength = useAppSelector(lobbyPeersLengthSelector);
	const files = useAppSelector(filesLengthSelector);

	const [ mobileMoreAnchorEl, setMobileMoreAnchorEl ] = useState<HTMLElement | null>();

	const handleMenuClose = () => {
		setMobileMoreAnchorEl(null);
	};

	const isMobile = platform === 'mobile';
	const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

	return (
		<Fragment>
			<AppBar
				position='fixed'
				sx={{
					...(!(isMobile || drawerOverlayed) && drawerOpen && {
						width: 'calc(100% - 30vw)',
						marginLeft: '30vw',
						[theme.breakpoints.down('lg')]: {
							width: 'calc(100% - 30vw)',
							marginLeft: '40vw'
						},
						[theme.breakpoints.down('md')]: {
							width: 'calc(100% - 40vw)',
							marginLeft: '50vw'
						},
						[theme.breakpoints.down('sm')]: {
							width: 'calc(100% - 60vw)',
							marginLeft: '70vw'
						},
						[theme.breakpoints.down('xs')]: {
							width: 'calc(100% - 80vw)',
							marginLeft: '90vw'
						},
					}),
					...(permanentTopBar ? {
						opacity: 1,
						transition: 'opacity .5s'
					} : {
						opacity: 0,
						transition: 'opacity .5s'
					}),
					backgroundColor: theme.appBarColor
				}}
			>
				<Toolbar>
					<PulsingBadge
						color='secondary'
						badgeContent={unread}
						onClick={() => dispatch(drawerActions.toggle())}
					>
						<IconButton
							color='inherit'
							aria-label={openDrawerLabel(intl)}
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
					<GrowingDiv />
					<DesktopDiv>
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
						{ files > 0 && <FilesharingButton type='iconbutton' /> }
						{ lobbyPeersLength > 0 && <LobbyButton type='iconbutton' /> }
						{ loginEnabled && <LoginButton type='iconbutton' /> }
					</DesktopDiv>
					<MobileDiv>
						{ lobbyPeersLength > 0 && <LobbyButton type='iconbutton' /> }
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

					<Button
						aria-label={leaveLabel(intl)}
						color='error'
						variant='contained'
						onClick={() => dispatch(uiActions.setUi({ leaveOpen: !leaveOpen }))}
					>
						<LeaveMessage />
					</Button>
				</Toolbar>
			</AppBar>
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
			</FloatingMenu>
		</Fragment>
	);
};

export default TopBar;
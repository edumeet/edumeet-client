import { AppBar, Badge, Button, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Fragment, MouseEvent, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { lobbyPeersLengthSelector, makePermissionSelector, peersLengthSelector, unreadSelector } from '../../store/selectors';
import { drawerActions } from '../../store/slices/drawerSlice';
import MenuIcon from '@mui/icons-material/Menu';
import MoreIcon from '@mui/icons-material/More';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import edumeetConfig from '../../utils/edumeetConfig';
import {
	enterFullscreenLabel,
	leaveFullscreenLabel,
	leaveLabel,
	LeaveMessage,
	lockRoomLabel,
	loginLabel,
	logoutLabel,
	moreActionsLabel,
	openDrawerLabel,
	showLobbyLabel,
	showParticipantsLabel,
	showSettingsLabel,
	unlockRoomLabel,
} from '../translated/translatedComponents';
import DesktopMenu from '../desktopmenu/DesktopMenu';
import MobileMenu from '../mobilemenu/MobileMenu';
import { permissions } from '../../utils/roles';
import { uiActions } from '../../store/slices/uiSlice';
import { permissionsActions } from '../../store/slices/permissionsSlice';
import { AccountCircle } from '@mui/icons-material';

interface TopBarProps {
	fullscreenEnabled: boolean;
	fullscreen: boolean;
	onFullscreen: () => void;
}

const PulsingBadge = styled(Badge)(({ theme }) => ({
	badge: {
		backgroundColor: theme.palette.secondary.main,
		'&::after': {
			position: 'absolute',
			width: '100%',
			height: '100%',
			borderRadius: '50%',
			animation: '$ripple 1.2s infinite ease-in-out',
			border: `3px solid ${theme.palette.secondary.main}`,
			content: '""'
		}
	},
	'@keyframes ripple': {
		'0%': {
			transform: 'scale(.8)',
			opacity: 1
		},
		'100%': {
			transform: 'scale(2.4)',
			opacity: 0
		}
	}
}));

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

const StyledIconButton = styled(IconButton)(({ theme }) => ({
	margin: theme.spacing(1, 0),
	padding: theme.spacing(0, 1)
}));

const TopBar = ({
	fullscreenEnabled,
	fullscreen,
	onFullscreen
}: TopBarProps): JSX.Element => {
	const intl = useIntl();
	const theme = useTheme();
	const dispatch = useAppDispatch();

	const hasLockPermission =
		useMemo(() => makePermissionSelector(permissions.CHANGE_ROOM_LOCK), []);
	const canLock = useAppSelector(hasLockPermission);
	const hasPromotionPermission =
		useMemo(() => makePermissionSelector(permissions.PROMOTE_PEER), []);
	const canPromote = useAppSelector(hasPromotionPermission);

	const {
		settingsOpen,
		lockDialogOpen,
		leaveOpen
	} = useAppSelector((state) => state.ui);

	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const locked = useAppSelector((state) => state.permissions.locked);
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const permanentTopBar = useAppSelector((state) => state.settings.permanentTopBar);
	const drawerOverlayed = useAppSelector((state) => state.settings.drawerOverlayed);
	const platform = useAppSelector((state) => state.me.browser.platform);
	const drawerOpen = useAppSelector((state) => state.drawer.open);
	const unread = useAppSelector(unreadSelector);
	const peersLength = useAppSelector(peersLengthSelector);
	const lobbyPeersLength = useAppSelector(lobbyPeersLengthSelector);

	const [ mobileMoreAnchorEl, setMobileMoreAnchorEl ] = useState<HTMLElement | null>();
	const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>();
	const [ currentMenu, setCurrentMenu ] = useState<
		'moreActions' |
		'localeMenu' |
		null |
		undefined
	>();

	const handleMenuOpen = (
		event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>,
		menu: 'moreActions' | 'localeMenu' | null |	undefined
	) => {
		setAnchorEl(event.currentTarget);
		setCurrentMenu(menu);
	};

	const handleExited = () => {
		setCurrentMenu(null);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setMobileMoreAnchorEl(null);
	};

	const openUsersTab = () => {
		dispatch(drawerActions.toggle());
		dispatch(drawerActions.setTab({ tab: 'users' }));
	};

	const isMobile = platform === 'mobile';
	const isMenuOpen = Boolean(anchorEl);
	const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

	const lockLabel = locked ?
		unlockRoomLabel(intl) : lockRoomLabel(intl);
	const fullscreenLabel = fullscreen ?
		leaveFullscreenLabel(intl) : enterFullscreenLabel(intl);
	const loginButtonLabel = loggedIn ? logoutLabel(intl) : loginLabel(intl);

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
						<Tooltip title={moreActionsLabel(intl)}>
							<IconButton
								aria-owns={
									isMenuOpen &&
									currentMenu === 'moreActions' ?
										'material-appbar' : undefined
								}
								aria-haspopup
								onClick={(event) => handleMenuOpen(event, 'moreActions')}
								color='inherit'
							>
								<MoreIcon />
							</IconButton>
						</Tooltip>
						{ fullscreenEnabled &&
							<Tooltip title={fullscreenLabel}>
								<StyledIconButton
									aria-label={fullscreenLabel}
									color='inherit'
									onClick={onFullscreen}
								>
									{ fullscreen ?
										<FullscreenExitIcon />
										:
										<FullscreenIcon />
									}
								</StyledIconButton>
							</Tooltip>
						}
						<Tooltip title={showParticipantsLabel(intl)}>
							<div>
								<IconButton
									aria-label={showParticipantsLabel(intl)}
									color='inherit'
									onClick={() => openUsersTab()}
								>
									<Badge
										color='primary'
										badgeContent={peersLength + 1}
									>
										<PeopleIcon />
									</Badge>
								</IconButton>
							</div>
						</Tooltip>
						<Tooltip title={showSettingsLabel(intl)}>
							<div>
								<StyledIconButton
									aria-label={showSettingsLabel(intl)}
									color='inherit'
									onClick={() => dispatch(
										uiActions.setUi({ settingsOpen: !settingsOpen })
									)}
								>
									<SettingsIcon />
								</StyledIconButton>
							</div>
						</Tooltip>
						<Tooltip title={lockLabel}>
							<div>
								<StyledIconButton
									aria-label={lockLabel}
									color='inherit'
									disabled={!canLock}
									onClick={() =>
										dispatch(
											permissionsActions.setLocked({ locked: !locked, local: true }))
									}
								>
									{ locked ? <LockIcon />:<LockOpenIcon /> }
								</StyledIconButton>
							</div>
						</Tooltip>
						{ lobbyPeersLength > 0 &&
							<Tooltip
								title={showLobbyLabel(intl)}
							>
								<StyledIconButton
									aria-label={showLobbyLabel(intl)}
									color='inherit'
									disabled={!canPromote}
									onClick={() => 
										dispatch(uiActions.setUi({ lockDialogOpen: !lockDialogOpen }))
									}
								>
									<PulsingBadge
										color='secondary'
										badgeContent={lobbyPeersLength}
									>
										<SecurityIcon />
									</PulsingBadge>
								</StyledIconButton>
							</Tooltip>
						}
						{ loginEnabled &&
							<Tooltip title={loginButtonLabel}>
								<StyledIconButton
									aria-label={loginButtonLabel}
									color='inherit'
									// eslint-disable-next-line no-console
									onClick={() => console.log('Login!')}
								>
									<AccountCircle />
								</StyledIconButton>
							</Tooltip>
						}
					</DesktopDiv>
					<MobileDiv>
						{ lobbyPeersLength > 0 &&
						<Tooltip
							title={showLobbyLabel(intl)}
						>
							<StyledIconButton
								aria-label={showLobbyLabel(intl)}
								color='inherit'
								disabled={!canPromote}
								onClick={() =>
									dispatch(uiActions.setUi({ lockDialogOpen: !lockDialogOpen }))}
							>
								<PulsingBadge
									color='secondary'
									badgeContent={lobbyPeersLength}
								>
									<SecurityIcon />
								</PulsingBadge>
							</StyledIconButton>
						</Tooltip>
						}
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
			<DesktopMenu
				anchorEl={anchorEl}
				open={isMenuOpen}
				currentMenu={currentMenu}
				onClose={handleMenuClose}
				onExited={handleExited}
			/>
			<MobileMenu
				fullscreen={fullscreen}
				fullscreenEnabled={fullscreenEnabled}
				onFullscreen={onFullscreen}
				anchorEl={mobileMoreAnchorEl}
				open={isMobileMenuOpen}
				onClose={handleMenuClose}
			/>
		</Fragment>
	);
};

export default TopBar;
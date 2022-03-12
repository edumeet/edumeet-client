import { AccountCircle } from '@mui/icons-material';
import { Badge, Menu, MenuItem } from '@mui/material';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { makePermissionSelector, peersLengthSelector } from '../../store/selectors';
import { permissionsActions } from '../../store/slices/permissionsSlice';
import { permissions } from '../../utils/roles';
import {
	aboutLabel,
	AboutMessage,
	addVideoLabel,
	AddVideoMessage,
	enterFullscreenLabel,
	EnterFullscreenMessage,
	helpLabel,
	HelpMessage,
	hideSelfViewLabel,
	HideSelfViewMessage,
	LockMessage,
	lockRoomLabel,
	loginLabel,
	LoginMessage,
	logoutLabel,
	LogoutMessage,
	showParticipantsLabel,
	ShowParticipantsMessage,
	showSelfViewLabel,
	ShowSelfViewMessage,
	showSettingsLabel,
	ShowSettingsMessage,
	UnlockMessage,
	unlockRoomLabel
} from '../translated/translatedComponents';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import SelfViewOnIcon from '@mui/icons-material/Videocam';
import SelfViewOffIcon from '@mui/icons-material/VideocamOff';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import { uiActions } from '../../store/slices/uiSlice';
import { drawerActions } from '../../store/slices/drawerSlice';
import MoreActions from '../moreactions/MoreActions';

interface MobileMenuProps {
	fullscreen: boolean;
	fullscreenEnabled: boolean;
	onFullscreen: () => void;
	anchorEl: HTMLElement | null | undefined;
	open: boolean;
	onClose: () => void;
}

const MobileMenu = ({
	fullscreen,
	fullscreenEnabled,
	onFullscreen,
	anchorEl,
	open,
	onClose
}: MobileMenuProps): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();

	const hasExtraVideoPermission =
		useMemo(() => makePermissionSelector(permissions.EXTRA_VIDEO), []);
	const canProduceExtraVideo = useAppSelector(hasExtraVideoPermission);
	const hasLockPermission =
		useMemo(() => makePermissionSelector(permissions.CHANGE_ROOM_LOCK), []);
	const canLock = useAppSelector(hasLockPermission);

	const {
		settingsOpen,
		extraVideoOpen,
		hideSelfView,
		helpOpen,
		aboutOpen
	} = useAppSelector((state) => state.ui);
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const locked = useAppSelector((state) => state.permissions.locked);
	const peersLength = useAppSelector(peersLengthSelector);

	const loginButtonLabel = loggedIn ? logoutLabel(intl) : loginLabel(intl);
	const lockLabel = locked ? unlockRoomLabel(intl) : lockRoomLabel(intl);

	const openUsersTab = () => {
		dispatch(drawerActions.toggle());
		dispatch(drawerActions.setTab({ tab: 'users' }));
	};

	return (
		<Menu
			anchorEl={anchorEl}
			anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			open={open}
			onClose={onClose}
		>
			{ loginEnabled &&
				<MenuItem
					aria-label={loginButtonLabel}
					onClick={() => {
						onClose();
						dispatch(permissionsActions.setLoggedIn({ loggedIn: !loggedIn }));
					}}
				>
					<AccountCircle />
					{ loggedIn ?
						<MoreActions>
							<LogoutMessage />
						</MoreActions>
						:
						<MoreActions>
							<LoginMessage />
						</MoreActions>
					}
				</MenuItem>
			}
			<MenuItem
				aria-label={lockLabel}
				disabled={!canLock}
				onClick={() => {
					onClose();

					dispatch(permissionsActions.setLocked({ locked: !locked }));
				}}
			>
				{ locked ? <LockIcon /> : <LockOpenIcon /> }
				{ locked ?
					<MoreActions>
						<UnlockMessage />
					</MoreActions>
					:
					<MoreActions>
						<LockMessage />
					</MoreActions>
				}
			</MenuItem>
			<MenuItem
				aria-label={showSettingsLabel(intl)}
				onClick={() => {
					onClose();
					dispatch(uiActions.setUi({ settingsOpen: !settingsOpen }));
				}}
			>
				<SettingsIcon />
				<MoreActions>
					<ShowSettingsMessage />
				</MoreActions>
			</MenuItem>
			<MenuItem
				aria-label={showParticipantsLabel(intl)}
				onClick={() => {
					onClose();
					openUsersTab();
				}}
			>
				<Badge
					color='primary'
					badgeContent={peersLength + 1}
				>
					<PeopleIcon />
				</Badge>
				<MoreActions>
					<ShowParticipantsMessage />
				</MoreActions>
			</MenuItem>
			{ fullscreenEnabled &&
				<MenuItem
					aria-label={enterFullscreenLabel(intl)}
					onClick={() => {
						onClose();
						onFullscreen();
					}}
				>
					{ fullscreen ?
						<FullscreenExitIcon />
						:
						<FullscreenIcon />
					}
					<MoreActions>
						<EnterFullscreenMessage />
					</MoreActions>
				</MenuItem>
			}
			<MenuItem
				disabled={!canProduceExtraVideo}
				onClick={() => {
					onClose();
					dispatch(uiActions.setUi({ extraVideoOpen: !extraVideoOpen }));
				}}
			>
				<VideoCallIcon aria-label={addVideoLabel(intl)} />
				<MoreActions>
					<AddVideoMessage />
				</MoreActions>
			</MenuItem>
			<MenuItem
				onClick={() => {
					onClose();
					dispatch(uiActions.setUi({ hideSelfView: !hideSelfView }));
				}}
			>
				{ hideSelfView ?
					<SelfViewOnIcon aria-label={showSelfViewLabel(intl)} />
					:
					<SelfViewOffIcon aria-label={hideSelfViewLabel(intl)} />
				}
				{ hideSelfView ?
					<MoreActions>
						<ShowSelfViewMessage />
					</MoreActions>
					:
					<MoreActions>
						<HideSelfViewMessage />
					</MoreActions>
				}
			</MenuItem>
			<MenuItem
				onClick={() => {
					onClose();
					dispatch(uiActions.setUi({ helpOpen: !helpOpen }));
				}}
			>
				<HelpIcon aria-label={helpLabel(intl)} />
				<MoreActions>
					<HelpMessage />
				</MoreActions>
			</MenuItem>
			<MenuItem
				onClick={() => {
					onClose();
					dispatch(uiActions.setUi({ aboutOpen: !aboutOpen }));
				}}
			>
				<InfoIcon aria-label={aboutLabel(intl)} />
				<MoreActions>
					<AboutMessage />
				</MoreActions>
			</MenuItem>
		</Menu>
	);
};

export default MobileMenu;
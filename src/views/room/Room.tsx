import { useEffect, useState } from 'react';
import fscreen from 'fscreen';
import Notifications from '../../components/notifications/Notifications';
import MeetingDrawer from '../../components/meetingdrawer/MeetingDrawer';
import Democratic from '../../components/democratic/Democratic';
import LockDialog from '../../components/lockdialog/LockDialog';
import Settings from '../../components/settingsdialog/SettingsDialog';
import TopBar from '../../components/topbar/TopBar';
import StyledBackground from '../../components/StyledBackground';
import { Drawer, Hidden, SwipeableDrawer } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { drawerActions } from '../../store/slices/drawerSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import FullscreenVideo from '../../components/fullscreenvideo/FullscreenVideo';
import WindowedVideo from '../../components/windowedvideo/WindowedVideo';

const StyledSwipeableDrawer = styled(SwipeableDrawer)(({ theme }) => ({
	paper: {
		width: '30vw',
		[theme.breakpoints.down('lg')]: {
			width: '30vw'
		},
		[theme.breakpoints.down('md')]: {
			width: '40vw'
		},
		[theme.breakpoints.down('sm')]: {
			width: '60vw'
		},
		[theme.breakpoints.down('xs')]: {
			width: '80vw'
		}
	}
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
	paper: {
		width: '30vw',
		[theme.breakpoints.down('lg')]: {
			width: '30vw'
		},
		[theme.breakpoints.down('md')]: {
			width: '40vw'
		},
		[theme.breakpoints.down('sm')]: {
			width: '60vw'
		},
		[theme.breakpoints.down('xs')]: {
			width: '80vw'
		}
	}
}));

const StyledNav = styled('nav')(({ theme }) => ({
	width: '30vw',
	flexShrink: 0,
	[theme.breakpoints.down('lg')]: {
		width: '30vw'
	},
	[theme.breakpoints.down('md')]: {
		width: '40vw'
	},
	[theme.breakpoints.down('sm')]: {
		width: '60vw'
	},
	[theme.breakpoints.down('xs')]: {
		width: '80vw'
	}
}));

const container = window !== undefined ? window.document.body : undefined;

const Room = (): JSX.Element => {
	const [ isFullscreen, setFullscreen ] = useState(false);
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const browser = useAppSelector((state) => state.me.browser);
	const ui = useAppSelector((state) => state.ui);
	const settings = useAppSelector((state) => state.settings);
	const drawer = useAppSelector((state) => state.drawer);

	useEffect(() => {
		if (fscreen.fullscreenEnabled) {
			fscreen.addEventListener('fullscreenchange', handleFullscreenChange);
		}

		return () => {
			if (fscreen.fullscreenEnabled) {
				fscreen.removeEventListener('fullscreenchange', handleFullscreenChange);
			}
		};
	}, []);

	const handleToggleFullscreen = () => {
		if (fscreen.fullscreenElement) {
			fscreen.exitFullscreen();
		} else {
			fscreen.requestFullscreen(document.documentElement);
		}
	};

	const handleFullscreenChange = () => {
		setFullscreen(fscreen.fullscreenElement !== null);
	};

	const toggleDrawer = () => {
		dispatch(drawerActions.toggle());
	};

	return (
		<StyledBackground>
			<FullscreenVideo />
			<WindowedVideo />

			{ /*
				<AudioPeers />
			*/}

			{ settings.showNotifications &&
				<Notifications />
			}

			<TopBar
				fullscreenEnabled={fscreen.fullscreenEnabled}
				fullscreen={isFullscreen}
				onFullscreen={handleToggleFullscreen}
			/>

			{ (browser.platform === 'mobile' || settings.drawerOverlayed) ?
				<nav>
					<Hidden implementation='css'>
						<StyledSwipeableDrawer
							container={container}
							variant='temporary'
							anchor={theme.direction === 'rtl' ? 'right' : 'left'}
							open={drawer.open}
							onClose={toggleDrawer}
							onOpen={toggleDrawer}
							ModalProps={{
								keepMounted: true // Better open performance on mobile.
							}}
						>
							<MeetingDrawer closeDrawer={toggleDrawer} />
						</StyledSwipeableDrawer>
					</Hidden>
				</nav>
				:
				<StyledNav>
					<Hidden implementation='css'>
						<StyledDrawer
							variant='persistent'
							anchor={theme.direction === 'rtl' ? 'right' : 'left'}
							open={drawer.open}
							onClose={toggleDrawer}
						>
							<MeetingDrawer closeDrawer={toggleDrawer} />
						</StyledDrawer>
					</Hidden>
				</StyledNav>
			}

			<Democratic />

			{ ui.lockDialogOpen &&
				<LockDialog />
			}

			{ ui.settingsOpen &&
				<Settings />
			}
		</StyledBackground>
	);
};

export default Room;
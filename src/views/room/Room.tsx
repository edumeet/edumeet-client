import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import fscreen from 'fscreen';
import Notifications from '../../components/notifications/Notifications';
import MeetingDrawer from '../../components/meetingdrawer/MeetingDrawer';
import Democratic from '../../components/democratic/Democratic';
import AudioPeers from '../../components/audiopeers/AudioPeers';
import FullscreenVideo from '../../components/fullscreenvideo/FullscreenVideo';
import WindowedVideo from '../../components/windowedvideo/WindowedVideo';
import LockDialog from '../../components/lockdialog/LockDialog';
import Settings from '../../components/settingsdialog/SettingsDialog';
import TopBar from '../../components/topbar/TopBar';
import { RootState } from '../../store/store';
import { uiActions } from '../../store/slices/uiSlice';
import StyledBackground from '../../components/StyledBackground';
import { Drawer, Hidden, SwipeableDrawer } from '@mui/material';
import { styled, useTheme } from '@mui/system';
import { drawerActions } from '../../store/slices/drawerSlice';

const StyledSwipeableDrawer = styled(SwipeableDrawer)(({ theme }) => ({
	'.MuiDrawer-paper': {
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
	'.MuiDrawer-paper': {
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

const Room = () => {
	const [ isFullscreen, setFullscreen ] = useState(false);
	const dispatch = useDispatch();
	const theme = useTheme();
	const toolbarsVisible = useSelector((state: RootState) => state.ui.toolbarsVisible);
	const browser = useSelector((state: RootState) => state.me.browser);
	const ui = useSelector((state: RootState) => state.ui);
	const settings = useSelector((state: RootState) => state.settings);
	const drawer = useSelector((state: RootState) => state.drawer);

	const handleMovement = () => {
		if (!toolbarsVisible) {
			dispatch(uiActions.setToolbarsVisible({ toolbarsVisible: true }));
		}
	};

	useEffect(() => {
		if (fscreen.fullscreenEnabled) {
			fscreen.addEventListener('fullscreenchange', handleFullscreenChange);
		}

		window.addEventListener('mousemove', handleMovement);
		window.addEventListener('touchstart', handleMovement);

		return () => {
			if (fscreen.fullscreenEnabled) {
				fscreen.removeEventListener('fullscreenchange', handleFullscreenChange);
			}
	
			window.removeEventListener('mousemove', handleMovement);
			window.removeEventListener('touchstart', handleMovement);
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
			<FullscreenVideo advancedMode={settings.advancedMode} />

			<WindowedVideo advancedMode={settings.advancedMode} />

			<AudioPeers />

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

			<Democratic advancedMode={settings.advancedMode} />

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
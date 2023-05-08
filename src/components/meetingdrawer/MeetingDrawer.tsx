import {
	AppBar,
	Badge,
	Hidden,
	IconButton,
	styled,
	SwipeableDrawer,
	Tab,
	Tabs,
	useTheme
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { raisedHandsSelector } from '../../store/selectors';
import { drawerActions, ToolAreaTab } from '../../store/slices/drawerSlice';
import GroupIcon from '@mui/icons-material/Group';
import ChatIcon from '@mui/icons-material/Chat';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NewWindowIcon from '@mui/icons-material/OpenInNew';
import { chatLabel, participantsLabel } from '../translated/translatedComponents';
import ParticipantList from '../participantlist/ParticipantList';
import SeparateWindow from '../separatewindow/SeparateWindow';
import { uiActions } from '../../store/slices/uiSlice';
import Chat from '../chat/Chat';
import BreakoutRooms from '../breakoutrooms/BreakoutRooms';

const StyledSwipeableDrawer = styled(SwipeableDrawer)(({ theme }) => ({
	'& .MuiDrawer-paper': {
		width: '30vw',
		[theme.breakpoints.down('lg')]: {
			width: '40vw'
		},
		[theme.breakpoints.down('md')]: {
			width: '60vw'
		},
		[theme.breakpoints.down('sm')]: {
			width: '80vw'
		}
	}
}));

const container = window !== undefined ? window.document.body : undefined;

const MeetingDrawerDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	height: '100%',
	backgroundColor: theme.palette.background.paper
}));

const MeetingDrawerWindow = styled('div')({
	display: 'flex',
	flexDirection: 'row',
	width: '100%',
	height: '100%',
});

const MeetingDrawerAppBar = styled(AppBar)({
	display: 'flex',
	flexDirection: 'row'
});

const TabsHeader = styled(Tabs)({
	flexGrow: 1
});

const tabs: ToolAreaTab[] = [
	'users',
	'chat',
	'breakoutRooms',
];

const MeetingDrawer = (): JSX.Element => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const browser = useAppSelector((state) => state.me.browser);
	const raisedHands = useAppSelector(raisedHandsSelector);
	const drawerWindow = useAppSelector((state) => state.ui.drawerWindow);
	const {
		tab: currentTab,
		unreadMessages,
		unreadFiles,
		open: drawerOpen
	} = useAppSelector((state) => state.drawer);

	const toggleDrawer = () => {
		dispatch(drawerActions.toggle());
	};

	return (
		<>
			{ drawerWindow ? (
				<SeparateWindow
					onClose={() => dispatch(uiActions.setUi({ drawerWindow: !drawerWindow }))}
				>
					<MeetingDrawerWindow>
						<Chat />
						<ParticipantList />
					</MeetingDrawerWindow>
				</SeparateWindow>
			) : (
				<nav>
					<Hidden implementation='css'>
						<StyledSwipeableDrawer
							container={container}
							variant='temporary'
							anchor={theme.direction === 'rtl' ? 'right' : 'left'}
							open={drawerOpen}
							onClose={toggleDrawer}
							onOpen={toggleDrawer}
							ModalProps={{
								keepMounted: true // Better open performance on mobile.
							}}
						>
							<MeetingDrawerDiv>
								<MeetingDrawerAppBar
									position='static'
									color='default'
								>
									<TabsHeader
										value={tabs.indexOf(currentTab)}
										onChange={
											(_event, value) =>
												dispatch(drawerActions.setTab(tabs[value]))
										}
										variant='fullWidth'
									>
										<Tab
											label={
												<Badge color='secondary' badgeContent={raisedHands}>
													<GroupIcon />
													{(browser.platform !== 'mobile') && participantsLabel()}
												</Badge>
											}
										/>
										<Tab
											label={
												<Badge
													color='secondary'
													badgeContent={(unreadMessages + unreadFiles)}
												>
													<ChatIcon />
													{(browser.platform !== 'mobile') && chatLabel()}
												</Badge>
											}
										/>
										<Tab label={ <GroupIcon /> } />
									</TabsHeader>
									{ browser.platform !== 'mobile' && (
										<IconButton
											onClick={() =>
												dispatch(uiActions.setUi({ drawerWindow: !drawerWindow }))}
										>
											<NewWindowIcon />
										</IconButton>
									)}
									{ browser.platform !== 'mobile' && (
										<IconButton onClick={toggleDrawer}>
											{ theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon /> }
										</IconButton>
									)}
								</MeetingDrawerAppBar>
								{ currentTab === 'chat' && <Chat /> }
								{ currentTab === 'users' && <ParticipantList /> }
								{ currentTab === 'breakoutRooms' && <BreakoutRooms />}
							</MeetingDrawerDiv>
						</StyledSwipeableDrawer>
					</Hidden>
				</nav>
			)}
		</>
	);
};

export default MeetingDrawer;
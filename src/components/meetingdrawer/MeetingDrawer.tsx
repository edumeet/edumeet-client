import {
	AppBar,
	Badge,
	IconButton,
	styled,
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
import { chatLabel, participantsLabel } from '../translated/translatedComponents';
import { useIntl } from 'react-intl';
import ParticipantList from '../participantlist/ParticipantList';

const MeetingDrawerDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	height: '100%',
	backgroundColor: theme.palette.background.paper
}));

const MeetingDrawerAppBar = styled(AppBar)({
	display: 'flex',
	flexDirection: 'row'
});

const tabs = [
	'users',
	'chat'
];

interface MeetingDrawerProps {
	closeDrawer: () => void;
}

const MeetingDrawer = ({ closeDrawer }: MeetingDrawerProps): JSX.Element => {
	const intl = useIntl();
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const browser = useAppSelector((state) => state.me.browser);
	const raisedHands = useAppSelector(raisedHandsSelector);
	const {
		tab: currentTab,
		unreadMessages,
		unreadFiles
	} = useAppSelector((state) => state.drawer);

	return (
		<MeetingDrawerDiv>
			<MeetingDrawerAppBar
				position='static'
				color='default'
			>
				<Tabs
					value={tabs.indexOf(currentTab)}
					onChange={
						(event, value) => dispatch(drawerActions.setTab(tabs[value] as ToolAreaTab))
					}
					indicatorColor='primary'
					textColor='primary'
					variant='fullWidth'
					sx={{
						flexGrow: 1
					}}
				>
					<Tab
						label={
							<Badge color='secondary' badgeContent={raisedHands}>
								<GroupIcon />&nbsp;
								{(browser.platform !== 'mobile') && participantsLabel(intl)}
							</Badge>
						}
					/>
					<Tab
						label={
							<Badge
								color='secondary'
								badgeContent={(unreadMessages + unreadFiles)}
							>
								<ChatIcon />&nbsp;
								{(browser.platform !== 'mobile') && chatLabel(intl)}
							</Badge>
						}
					/>
				</Tabs>
				{browser.platform !== 'mobile' && (
					<>
						<IconButton onClick={closeDrawer}>
							{ theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon /> }
						</IconButton>
					</>
				)}
			</MeetingDrawerAppBar>
			{/* currentTab === 'chat' && <Chat /> */}
			{currentTab === 'users' && <ParticipantList />}
		</MeetingDrawerDiv>
	);
};

export default MeetingDrawer;
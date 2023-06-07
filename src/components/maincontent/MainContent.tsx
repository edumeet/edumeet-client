import { memo } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Paper } from '@mui/material';
import ParticipantList from '../participantlist/ParticipantList';
import Democratic from '../democratic/Democratic';
import Chat from '../chat/Chat';
import { useAppSelector } from '../../store/hooks';
import { isMobileSelector } from '../../store/selectors';

const WrapperContainer = styled(Box)({
	width: 'calc(100% - 8px)',
	height: 'calc(100% - 60px)',
	display: 'flex',
	marginLeft: 4,
	marginRight: 4,
	marginBottom: 4,
	marginTop: 56,
	gap: 4,
});

const SideContent = styled(Box)(({ theme }) => ({
	height: '100%',
	display: 'flex',
	flexDirection: 'column',
	gap: 4,
	borderRadius: 10,
	width: '30vw',
	[theme.breakpoints.down('xl')]: {
		width: '40vw'
	},
	[theme.breakpoints.down('lg')]: {
		width: '50vw'
	},
	[theme.breakpoints.down('md')]: {
		width: '70vw'
	},
	[theme.breakpoints.down('sm')]: {
		width: '80vw'
	}
}));

interface SideContainerProps {
	height: string;
	width?: string;
}

const SideContainer = styled(Paper)<SideContainerProps>(({ height, width }) => ({
	height,
	width,
	overflowY: 'auto',
}));

const MainContent = (): JSX.Element => {
	const isMobile = useAppSelector(isMobileSelector);
	const chatOpen = useAppSelector((state) => state.ui.chatOpen);
	const participantListOpen = useAppSelector((state) => state.ui.participantListOpen);
	const eitherOpen = chatOpen || participantListOpen;

	const height = chatOpen && participantListOpen ? '50%' : '100%';

	return (
		<WrapperContainer>
			{ !isMobile && eitherOpen &&
				<SideContent>
					{ participantListOpen && <SideContainer height={height}><ParticipantList /></SideContainer> }
					{ chatOpen && <SideContainer height={height}><Chat /></SideContainer> }
				</SideContent>
			}
			<Democratic />
		</WrapperContainer>
	);
};

export default memo(MainContent);
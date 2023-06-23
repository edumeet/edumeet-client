import { memo } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Paper } from '@mui/material';
import ParticipantList from '../participantlist/ParticipantList';
import Democratic from '../democratic/Democratic';
import Chat from '../chat/Chat';
import { useAppSelector } from '../../store/hooks';
import { isMobileSelector } from '../../store/selectors';

const WrapperContainer = styled(Box)(({ theme }) => ({
	width: 'calc(100% - 8px)',
	height: 'calc(100% - 52px)',
	display: 'flex',
	marginLeft: theme.spacing(0.5),
	marginRight: theme.spacing(0.5),
	marginBottom: theme.spacing(0.5),
	marginTop: 48,
	gap: theme.spacing(0.5),
}));

interface SideContentProps {
	verticaldivide?: number;
	dynamicwidth?: number;
	bothopen?: number;
}

const SideContent = styled(Box)<SideContentProps>(({
	theme,
	verticaldivide,
	dynamicwidth,
	bothopen,
}) => ({
	height: '100%',
	display: 'flex',
	flexDirection: verticaldivide ? 'column' : 'row',
	gap: theme.spacing(0.5),
	...(dynamicwidth && {
		width: '40vw',
		[theme.breakpoints.down('xl')]: {
			width: '50vw'
		},
		[theme.breakpoints.down('lg')]: {
			width: '60vw'
		},
		[theme.breakpoints.down('md')]: {
			width: '70vw'
		},
		[theme.breakpoints.down('sm')]: {
			width: '80vw'
		},
		...(!verticaldivide && {
			...(bothopen ? {
				width: '60vw',
				[theme.breakpoints.down('xl')]: {
					width: '70vw'
				},
				[theme.breakpoints.down('lg')]: {
					width: '80vw'
				},
				[theme.breakpoints.down('md')]: {
					width: '90vw'
				},
			} : {
				width: '30vw',
				[theme.breakpoints.down('xl')]: {
					width: '40vw'
				},
				[theme.breakpoints.down('lg')]: {
					width: '50vw'
				},
				[theme.breakpoints.down('md')]: {
					width: '60vw'
				},
			}),
		})
	}),
}));

interface SideContainerProps {
	height: string;
	width?: string;
}

const SideContainer = styled(Paper)<SideContainerProps>(({ theme, height, width }) => ({
	height,
	width,
	overflowY: 'auto',
	borderRadius: theme.roundedness,
	backgroundColor: theme.sideContainerBackgroundColor,
}));

const MainContent = (): JSX.Element => {
	const isMobile = useAppSelector(isMobileSelector);
	const chatOpen = useAppSelector((state) => state.ui.chatOpen);
	const participantListOpen = useAppSelector((state) => state.ui.participantListOpen);
	const eitherOpen = chatOpen || participantListOpen;
	const bothOpen = chatOpen && participantListOpen;
	const verticalDivide = useAppSelector((state) => state.settings.verticalDivide);
	const dynamicWidth = useAppSelector((state) => state.settings.dynamicWidth);

	const height = (chatOpen && participantListOpen) && verticalDivide ? '50%' : '100%';

	return (
		<WrapperContainer>
			<Democratic />
			{ !isMobile && eitherOpen &&
				<SideContent
					verticaldivide={verticalDivide ? 1 : 0}
					dynamicwidth={dynamicWidth ? 1 : 0}
					bothopen={bothOpen ? 1 : 0}
				>
					{ participantListOpen && <SideContainer height={height} width='100%'><ParticipantList /></SideContainer> }
					{ chatOpen && <SideContainer height={height} width='100%'><Chat /></SideContainer> }
				</SideContent>
			}
		</WrapperContainer>
	);
};

export default memo(MainContent);
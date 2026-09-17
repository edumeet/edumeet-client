import { memo, useEffect, useRef, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Paper } from '@mui/material';
import ParticipantList from '../participantlist/ParticipantList';
import Democratic from '../democratic/Democratic';
import Chat from '../chat/Chat';
import { useAppSelector } from '../../store/hooks';
import { isMobileSelector, selectedVideoBoxesSelector, videoBoxesSelector } from '../../store/selectors';
import Spotlights from '../spotlights/Spotlights';
import ControlButtonsBar from '../controlbuttonsbar/ControlButtonsBar';
import GeneralStats from '../rtpquality/GeneralStats';

const WrapperContainer = styled(Box)(({ theme }) => ({
	width: 'calc(100% - 8px)',
	height: 'calc(100% - 52px)',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	marginLeft: theme.spacing(0.5),
	marginRight: theme.spacing(0.5),
	marginBottom: theme.spacing(0.5),
	marginTop: 48,
	gap: theme.spacing(0.5),
	// Own stacking context: the fullscreen video, a later sibling in Room, covers
	// everything in here whatever z-index a tile overlay or the stats panel uses.
	isolation: 'isolate',
}));

type MainContainerProps = {
	horizontal: number;
};

const MainContainer = styled(Box)<MainContainerProps>(({ theme, horizontal }) => ({
	width: '100%',
	height: '100%',
	display: 'flex',
	flexDirection: horizontal ? 'row' : 'column',
	gap: theme.spacing(0.5),
	overflow: 'auto',
}));

interface SideContentProps {
	verticaldivide?: number;
	bothopen?: number;
}

const SideContent = styled(Box)<SideContentProps>(({
	theme,
	verticaldivide,
	bothopen,
}) => ({
	height: '100%',
	display: 'flex',
	flexDirection: verticaldivide ? 'column' : 'row',
	gap: theme.spacing(0.5),
	width: bothopen && !verticaldivide ? '60rem' : '30rem',
}));

interface SideContainerProps {
	height: string;
	width?: string;
}

// The client level stats panel is part of the stats overlay toggled with 'Q'.
// Bottom left is the least contested corner: the controls bar is centered, the
// chat and participant panels are on the right, and the per tile stats windows
// sit in each tile's top left.
const GeneralStatsContainer = styled(Box)(({ theme }) => ({
	position: 'fixed',
	bottom: theme.spacing(1),
	left: theme.spacing(1),
	zIndex: 20,
	maxHeight: 'calc(100% - 128px)',
	overflow: 'auto',
}));

const SideContainer = styled(Paper)<SideContainerProps>(({ theme, height, width }) => ({
	height,
	width,
	overflowY: 'auto',
	borderRadius: theme.roundedness,
	backgroundColor: theme.sideContainerBackgroundColor,
}));

const MainContent = (): React.JSX.Element => {
	const [ windowSize, setWindowSize ] = useState(0);
	const [ horizontal, setHorizontal ] = useState(true);

	const mainContainer = useRef<HTMLDivElement>(null);

	const isMobile = useAppSelector(isMobileSelector);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);
	const chatOpen = useAppSelector((state) => state.ui.chatOpen);
	const participantListOpen = useAppSelector((state) => state.ui.participantListOpen);
	const eitherOpen = chatOpen || participantListOpen;
	const bothOpen = chatOpen && participantListOpen;
	const verticalDivide = useAppSelector((state) => state.settings.verticalDivide);
	const headless = useAppSelector((state) => state.room.headless);
	const spotlightsVisible = useAppSelector(selectedVideoBoxesSelector) > 0;
	const videosVisible = useAppSelector(videoBoxesSelector) > 0;
	const showStats = useAppSelector((state) => state.ui.showStats);

	const height = (chatOpen && participantListOpen) && verticalDivide ? '50%' : '100%';

	useEffect(() => {
		if (!mainContainer.current) return;

		let timeoutId: ReturnType<typeof setTimeout> | undefined;

		const resizeListener = (entries: ResizeObserverEntry[]) => {
			clearTimeout(timeoutId);

			const { contentRect: { width: mainWidth, height: mainHeight } } = entries[0];

			timeoutId = setTimeout(() => {
				setHorizontal((mainWidth / mainHeight) > aspectRatio);
				setWindowSize(mainWidth + mainHeight);
			}, 100);
		};

		const resizeObserver = new ResizeObserver(resizeListener);

		resizeObserver.observe(mainContainer.current);

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	return (
		<WrapperContainer ref={mainContainer}>
			{ !headless && <ControlButtonsBar /> }
			{ !isMobile && showStats && <GeneralStatsContainer><GeneralStats /></GeneralStatsContainer> }
			<MainContainer horizontal={horizontal ? 1 : 0} >
				{ spotlightsVisible && <Spotlights windowSize={windowSize} horizontal={horizontal} videos={videosVisible} /> }
				{ videosVisible && <Democratic windowSize={windowSize} horizontal={spotlightsVisible && horizontal} spotlights={spotlightsVisible} /> }
			</MainContainer>
			{ !isMobile && eitherOpen &&
				<SideContent
					verticaldivide={verticalDivide ? 1 : 0}
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

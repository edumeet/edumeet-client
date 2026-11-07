import { memo, useEffect, useRef, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Paper } from '@mui/material';
import ParticipantList from '../participantlist/ParticipantList';
import Democratic from '../democratic/Democratic';
import Chat from '../chat/Chat';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { settingsActions } from '../../store/slices/settingsSlice';
import { isMobileSelector, selectedVideoBoxesSelector, videoBoxesSelector } from '../../store/selectors';
import Spotlights from '../spotlights/Spotlights';
import ControlButtonsBar from '../controlbuttonsbar/ControlButtonsBar';
import GeneralStats from '../rtpquality/GeneralStats';
import { chooseHorizontal } from '../../utils/videoLayout';
import ResizeHandle from './ResizeHandle';
import { useResizable } from './useResizable';
import { resizeParticipantListAndChatLabel, resizeSidePanelsLabel, resizeVideoAreasLabel } from '../translated/translatedComponents';

// Limits for the dividers, in px.
const MIN_SIDE_PANEL_WIDTH = 240;
const MIN_VIDEO_AREA_WIDTH = 320;
const MIN_PARTICIPANT_VIDEOS_SIZE = 160;
const MIN_SPOTLIGHTS_SIZE = 240;
const MIN_SIDE_PANEL_SIZE = 120;

// Half the gap between the areas; a divider sits in the middle of the gap.
const HALF_GAP = 2;

const clamp = (value: number, min: number, max: number): number =>
	Math.round(Math.min(Math.max(min, max), Math.max(min, value)));

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
	minWidth: 0,
}));

interface SideContentProps {
	verticaldivide?: number;
	bothopen?: number;
	customwidth?: number;
}

const SideContent = styled(Box)<SideContentProps>(({
	theme,
	verticaldivide,
	bothopen,
	customwidth,
}) => ({
	height: '100%',
	display: 'flex',
	flexDirection: verticaldivide ? 'column' : 'row',
	gap: theme.spacing(0.5),
	width: bothopen && !verticaldivide ? '60rem' : '30rem',
	// A width chosen by dragging the divider is used as is, as long as some
	// room is left for the videos.
	...(customwidth !== undefined && {
		width: customwidth,
		flexShrink: 0,
		maxWidth: `calc(100% - ${MIN_VIDEO_AREA_WIDTH}px)`,
	}),
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
	const [ videoArea, setVideoArea ] = useState({ width: 0, height: 0 });
	const [ horizontal, setHorizontal ] = useState(true);
	const windowSize = videoArea.width + videoArea.height;

	const mainContainer = useRef<HTMLDivElement>(null);
	const videoContainer = useRef<HTMLDivElement>(null);
	const sideContent = useRef<HTMLDivElement>(null);

	const dispatch = useAppDispatch();

	const isMobile = useAppSelector(isMobileSelector);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);
	const chatOpen = useAppSelector((state) => state.ui.chatOpen);
	const participantListOpen = useAppSelector((state) => state.ui.participantListOpen);
	const eitherOpen = chatOpen || participantListOpen;
	const bothOpen = chatOpen && participantListOpen;
	const verticalDivide = useAppSelector((state) => state.settings.verticalDivide);
	const headless = useAppSelector((state) => state.room.headless);
	const spotlightCount = useAppSelector(selectedVideoBoxesSelector);
	const videoCount = useAppSelector(videoBoxesSelector);
	const spotlightsVisible = spotlightCount > 0;
	const videosVisible = videoCount > 0;
	const showStats = useAppSelector((state) => state.ui.showStats);
	const sidePanelWidth = useAppSelector((state) => state.settings.sidePanelWidth);
	const videoSplit = useAppSelector((state) => state.settings.videoSplit);
	const sidePanelSplit = useAppSelector((state) => state.settings.sidePanelSplit);

	const showSidePanels = !isMobile && eitherOpen;
	const showVideoSplit = !headless && spotlightsVisible && videosVisible;

	// Divider between the videos and the side panels. The stored width is per
	// panel, so two panels side by side get twice as much.
	const sideColumns = bothOpen && !verticalDivide ? 2 : 1;
	const sidePanels = useResizable({
		after: true,
		measure: () => sideContent.current?.getBoundingClientRect().width ?? 0,
		clamp: (width) => clamp(
			width,
			MIN_SIDE_PANEL_WIDTH * sideColumns,
			(mainContainer.current?.clientWidth ?? Infinity) - MIN_VIDEO_AREA_WIDTH
		),
		commit: (width) => dispatch(settingsActions.setSidePanelWidth(Math.round(width / sideColumns))),
	});
	const sideWidth = sidePanels.dragSize ??
		(sidePanelWidth !== undefined ? sidePanelWidth * sideColumns : undefined);

	// Divider between the spotlights (screen shares etc.) and the participant
	// videos. It lies across the axis the two are laid out on, and the share the
	// participant videos get is kept per layout.
	const splitLayout = horizontal ? 'row' : 'column';
	const videoAreaSize = (): number => {
		const current = videoContainer.current;

		if (!current) return 0;

		return horizontal ? current.clientWidth : current.clientHeight;
	};
	const videoAreas = useResizable({
		after: true,
		measure: (handle) => {
			const container = videoContainer.current?.getBoundingClientRect();
			const own = handle.getBoundingClientRect();

			if (!container) return 0;

			return horizontal ?
				container.right - ((own.left + own.right) / 2) - HALF_GAP :
				container.bottom - ((own.top + own.bottom) / 2) - HALF_GAP;
		},
		clamp: (size) => clamp(
			size,
			MIN_PARTICIPANT_VIDEOS_SIZE,
			videoAreaSize() - MIN_SPOTLIGHTS_SIZE - (2 * HALF_GAP)
		),
		commit: (size) => {
			const total = videoAreaSize();

			if (total > 0)
				dispatch(settingsActions.setVideoSplit({ layout: splitLayout, share: size / total }));
		},
	});
	const participantVideosShare = !showVideoSplit ? undefined :
		videoAreas.dragSize !== undefined ? videoAreas.dragSize / Math.max(1, videoAreaSize()) :
			videoSplit?.[splitLayout];

	const height = (chatOpen && participantListOpen) && verticalDivide ? '50%' : '100%';

	// Divider between the participant list and the chat when both are open:
	// across the axis they are laid out on, with the share the participant
	// list gets kept per layout.
	const sideSplitLayout = verticalDivide ? 'column' : 'row';
	const sidePanelsSize = (): number => {
		const current = sideContent.current;

		if (!current) return 0;

		return verticalDivide ? current.clientHeight : current.clientWidth;
	};
	// Sizes here are from the start of the side panels to the middle of the
	// divider, so the participant list itself is HALF_GAP smaller.
	const sidePanelsSplit = useResizable({
		measure: (handle) => {
			const container = sideContent.current?.getBoundingClientRect();
			const own = handle.getBoundingClientRect();

			if (!container) return 0;

			return verticalDivide ?
				((own.top + own.bottom) / 2) - container.top :
				((own.left + own.right) / 2) - container.left;
		},
		clamp: (size) => clamp(
			size,
			MIN_SIDE_PANEL_SIZE + HALF_GAP,
			sidePanelsSize() - MIN_SIDE_PANEL_SIZE - HALF_GAP
		),
		commit: (size) => {
			const total = sidePanelsSize();

			if (total > 0)
				dispatch(settingsActions.setSidePanelSplit({ layout: sideSplitLayout, share: size / total }));
		},
	});
	const participantListShare = !bothOpen ? undefined :
		sidePanelsSplit.dragSize !== undefined ? sidePanelsSplit.dragSize / Math.max(1, sidePanelsSize()) :
			sidePanelSplit?.[sideSplitLayout];

	// Height and width of the participant list and the chat.
	const sideSize = (share: number) => `calc(${share * 100}% - ${HALF_GAP}px)`;
	const participantListSize = participantListShare === undefined ?
		{ height, width: '100%' } :
		verticalDivide ?
			{ height: sideSize(participantListShare), width: '100%' } :
			{ height, width: sideSize(participantListShare) };
	const chatSize = participantListShare === undefined ?
		{ height, width: '100%' } :
		verticalDivide ?
			{ height: sideSize(1 - participantListShare), width: '100%' } :
			{ height, width: sideSize(1 - participantListShare) };

	useEffect(() => {
		const videos = videoContainer.current;

		if (!videos) return;

		let timeoutId: ReturnType<typeof setTimeout> | undefined;

		// The space the videos get, which also changes when the side panels
		// are resized.
		const resizeListener = () => {
			clearTimeout(timeoutId);

			timeoutId = setTimeout(() => {
				setVideoArea({ width: videos.clientWidth, height: videos.clientHeight });
			}, 100);
		};

		const resizeObserver = new ResizeObserver(resizeListener);

		resizeObserver.observe(videos);

		return () => {
			clearTimeout(timeoutId);
			resizeObserver.disconnect();
		};
	}, []);

	// Whether the spotlights and the participant videos go next to or above
	// each other: whichever shows them bigger in the space there is.
	useEffect(() => {
		setHorizontal((current) => chooseHorizontal({
			...videoArea,
			spotlights: spotlightCount,
			videos: videoCount,
			aspectRatio,
			headless,
			horizontal: current,
		}));
	}, [ videoArea, spotlightCount, videoCount, aspectRatio, headless ]);

	return (
		<WrapperContainer ref={mainContainer}>
			{ !headless && <ControlButtonsBar /> }
			{ !isMobile && showStats && <GeneralStatsContainer><GeneralStats /></GeneralStatsContainer> }
			<MainContainer ref={videoContainer} horizontal={horizontal ? 1 : 0} >
				{ spotlightsVisible && <Spotlights windowSize={windowSize} horizontal={horizontal} videos={videosVisible} /> }
				{ showVideoSplit &&
					<ResizeHandle
						orientation={horizontal ? 'vertical' : 'horizontal'}
						label={resizeVideoAreasLabel()}
						onReset={() => dispatch(settingsActions.setVideoSplit({ layout: splitLayout, share: undefined }))}
						{...videoAreas.handleProps}
					/>
				}
				{ videosVisible &&
					<Democratic
						windowSize={windowSize}
						horizontal={spotlightsVisible && horizontal}
						spotlights={spotlightsVisible}
						share={participantVideosShare}
					/>
				}
			</MainContainer>
			{ showSidePanels &&
				<ResizeHandle
					orientation='vertical'
					label={resizeSidePanelsLabel()}
					onReset={() => dispatch(settingsActions.setSidePanelWidth(undefined))}
					{...sidePanels.handleProps}
				/>
			}
			{ showSidePanels &&
				<SideContent
					ref={sideContent}
					verticaldivide={verticalDivide ? 1 : 0}
					bothopen={bothOpen ? 1 : 0}
					customwidth={sideWidth}
				>
					{ participantListOpen && <SideContainer {...participantListSize}><ParticipantList /></SideContainer> }
					{ bothOpen &&
						<ResizeHandle
							orientation={verticalDivide ? 'horizontal' : 'vertical'}
							label={resizeParticipantListAndChatLabel()}
							onReset={() => dispatch(settingsActions.setSidePanelSplit({ layout: sideSplitLayout, share: undefined }))}
							{...sidePanelsSplit.handleProps}
						/>
					}
					{ chatOpen && <SideContainer {...chatSize}><Chat /></SideContainer> }
				</SideContent>
			}
		</WrapperContainer>
	);
};

export default memo(MainContent);

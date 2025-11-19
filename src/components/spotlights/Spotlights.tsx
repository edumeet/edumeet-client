import { lazy, Suspense } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectedVideoBoxesSelector, selectedVideoConsumersSelector } from '../../store/selectors';
import VideoConsumer from '../videoconsumer/VideoConsumer';
import { Box } from '@mui/material';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
const DrawingView = lazy(() => import('../drawing/DrawingView')); // import DrawingView from '../drawing/DrawingView';

import DisplayName from '../displayname/DisplayName';
import MediaControls from '../mediacontrols/MediaControls';
import ScreenshareButton from '../controlbuttons/ScreenshareButton';
import ExtraVideoButton from '../controlbuttons/ExtraVideoButton';

type SpotlightsDivProps = {
	headless: number;
	horizontal: number;
	videos: number;
};

const SpotlightsDiv = styled(Box)<SpotlightsDivProps>(({
	theme,
	headless,
	horizontal,
	videos,
}) => ({
	width: '100%',
	height: headless || (!horizontal && videos) ? 'calc(100% - 8px)' : 'calc(100% - 64px)',
	marginBottom: headless || !horizontal ? 0 : 64,
	display: 'flex',
	flexDirection: 'row',
	gap: theme.spacing(1),
	flexWrap: 'wrap',
	overflow: 'hidden',
	justifyContent: 'center',
	alignItems: 'center',
	alignContent: 'center',
}));

type SpotlightsProps = {
	windowSize: number;
	horizontal: boolean;
	videos: boolean;
};

const Spotlights = ({
	windowSize,
	horizontal,
	videos,
}: SpotlightsProps): React.JSX.Element => {
	const theme = useTheme();
	const peersRef = useRef<HTMLDivElement>(null);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const verticalDivide = useAppSelector((state) => state.settings.verticalDivide);
	const chatOpen = useAppSelector((state) => state.ui.chatOpen);
	const participantListOpen = useAppSelector((state) => state.ui.participantListOpen);
	const boxes = useAppSelector(selectedVideoBoxesSelector);
	const videoConsumers = useAppSelector(selectedVideoConsumersSelector);
	const currentSession = useAppSelector((state) => state.me.sessionId);
	const headless = useAppSelector((state) => state.room.headless);
	const screenEnabled = useAppSelector((state) => state.me.screenEnabled);
	const extraVideoEnabled = useAppSelector((state) => state.me.extraVideoEnabled);
	const drawingEnabled = useAppSelector((state) => state.drawing.drawingEnabled);

	const displayName = useAppSelector((state) => state.settings.displayName);
	const [ dimensions, setDimensions ] = useState<Record<'peerWidth' | 'peerHeight', number>>({ peerWidth: 320, peerHeight: 240 });

	const updateDimensions = (): void => {
		const { current } = peersRef;

		if (!current || !boxes) return;

		const width = current.clientWidth;
		const height = current.clientHeight;

		let x = width;
		let y = height;
		let space;
		let rows;

		for (rows = 1; rows <= boxes; rows = rows + 1) {
			const columns = Math.ceil(boxes / rows);

			const verticalGaps = rows * parseInt(theme.spacing(1));
			const horizontalGaps = columns * parseInt(theme.spacing(1));

			x = (width - horizontalGaps) / columns;
			y = x / aspectRatio;

			if (height - verticalGaps < y * rows) {
				y = (height - verticalGaps) / rows;
				x = aspectRatio * y;

				break;
			}

			space = (height - verticalGaps) - (y * (rows));

			if (space < y) break;
		}

		const { peerWidth, peerHeight } = dimensions;

		if (peerWidth !== x || peerHeight !== y) {
			setDimensions({
				peerWidth: x,
				peerHeight: y
			});
		}
	};

	useEffect(() => updateDimensions(), [
		boxes,
		windowSize,
		hideSelfView,
		chatOpen,
		participantListOpen,
		verticalDivide,
		currentSession,
		videoConsumers,
		horizontal,
		videos
	]);

	const style = {
		width: dimensions.peerWidth,
		height: dimensions.peerHeight
	};

	return (
		<SpotlightsDiv ref={peersRef} headless={headless ? 1 : 0} horizontal={horizontal ? 1 : 0} videos={videos ? 1 : 0}>
			{ !hideSelfView && screenEnabled && (
				<VideoBox
					order={2}
					width={style.width}
					height={style.height}
				>
					<VideoView source='screen' contain />
					<DisplayName disabled={false} displayName={displayName} isMe />
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<ScreenshareButton
							onColor='default'
							offColor='error'
							disabledColor='default'
						/>
					</MediaControls>
				</VideoBox>
			)}
			{ !hideSelfView && extraVideoEnabled &&
				<VideoBox
					order={3}
					width={style.width}
					height={style.height}
				>
					<VideoView source='extravideo' />
					<DisplayName disabled={false} displayName={displayName} isMe />
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<ExtraVideoButton
							onColor='default'
							offColor='error'
							disabledColor='default'
						/>
					</MediaControls>
				</VideoBox>
			}
			{ drawingEnabled &&
				<VideoBox
					order={4}
					width={style.width}
					height={style.height}
				>
					<Suspense>
						<DrawingView width={style.width} height={style.height}/>
					</Suspense>
				</VideoBox>
			}

			{ videoConsumers.map((consumer) => (
				<VideoConsumer
					key={consumer.id}
					consumer={consumer}
					style={style}
				/>
			))}
		</SpotlightsDiv>
	);
};

export default Spotlights;

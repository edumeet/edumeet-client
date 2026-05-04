import { lazy, Suspense } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectedVideoConsumersSelector } from '../../store/selectors';
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

type TileSize = { width: number; height: number };

const SCREEN_KEY = 'screen';
const EXTRAVIDEO_KEY = 'extravideo';
const DRAWING_KEY = 'drawing';

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
	const videoConsumers = useAppSelector(selectedVideoConsumersSelector);
	const currentSession = useAppSelector((state) => state.me.sessionId);
	const headless = useAppSelector((state) => state.room.headless);
	const screenEnabled = useAppSelector((state) => state.me.screenEnabled);
	const extraVideoEnabled = useAppSelector((state) => state.me.extraVideoEnabled);
	const drawingEnabled = useAppSelector((state) => state.drawing.drawingEnabled);

	const displayName = useAppSelector((state) => state.settings.displayName);

	const [ aspects, setAspects ] = useState<Record<string, number>>({});
	const [ sizes, setSizes ] = useState<Record<string, TileSize>>({});

	const setAspect = useCallback((key: string, aspect: number) => {
		if (!isFinite(aspect) || aspect <= 0) return;
		setAspects((prev) => {
			const prevAspect = prev[key];

			if (prevAspect && Math.abs(prevAspect - aspect) < 0.001) return prev;

			return { ...prev, [key]: aspect };
		});
	}, []);

	const tileKeys: string[] = [];

	if (!hideSelfView && screenEnabled) tileKeys.push(SCREEN_KEY);
	if (!hideSelfView && extraVideoEnabled) tileKeys.push(EXTRAVIDEO_KEY);
	if (drawingEnabled) tileKeys.push(DRAWING_KEY);
	videoConsumers.forEach((c) => tileKeys.push(c.id));

	const tileKeysSig = tileKeys.join('|');

	useEffect(() => {
		setAspects((prev) => {
			const wanted = new Set(tileKeys);
			const next: Record<string, number> = {};
			let changed = false;

			for (const k of Object.keys(prev)) {
				if (wanted.has(k)) next[k] = prev[k];
				else changed = true;
			}

			return changed ? next : prev;
		});
	}, [ tileKeysSig ]);

	const updateDimensions = (): void => {
		const { current } = peersRef;

		if (!current || tileKeys.length === 0) return;

		const containerW = current.clientWidth;
		const containerH = current.clientHeight;

		const gap = parseInt(theme.spacing(1));

		const tileAspects = tileKeys.map((k) => aspects[k] || aspectRatio);
		const N = tileKeys.length;

		let bestArea = -1;
		let bestSizes: Record<string, TileSize> = {};

		for (let rows = 1; rows <= N; rows++) {
			const cols = Math.ceil(N / rows);
			const verticalGaps = rows * gap;
			const horizontalGaps = cols * gap;

			let rowH = (containerH - verticalGaps) / rows;

			if (rowH <= 0) continue;

			let maxRowW = 0;

			for (let r = 0; r < rows; r++) {
				const rowSlice = tileAspects.slice(r * cols, (r + 1) * cols);
				const rowW = rowSlice.reduce((s, a) => s + (rowH * a), 0);

				if (rowW > maxRowW) maxRowW = rowW;
			}

			const availW = containerW - horizontalGaps;

			if (maxRowW > availW && maxRowW > 0) rowH *= availW / maxRowW;
			if (rowH <= 0) continue;

			const totalArea = tileAspects.reduce((s, a) => s + (rowH * a * rowH), 0);

			if (totalArea > bestArea) {
				bestArea = totalArea;
				const candidate: Record<string, TileSize> = {};

				tileKeys.forEach((k, i) => {
					candidate[k] = { width: rowH * tileAspects[i], height: rowH };
				});
				bestSizes = candidate;
			}
		}

		const prevKeys = Object.keys(sizes);
		const nextKeys = Object.keys(bestSizes);
		let same = prevKeys.length === nextKeys.length;

		if (same) {
			for (const k of nextKeys) {
				const a = sizes[k];
				const b = bestSizes[k];

				if (!a || Math.abs(a.width - b.width) > 0.5 || Math.abs(a.height - b.height) > 0.5) {
					same = false;
					break;
				}
			}
		}

		if (!same) setSizes(bestSizes);
	};

	useEffect(() => updateDimensions(), [
		tileKeysSig,
		windowSize,
		hideSelfView,
		chatOpen,
		participantListOpen,
		verticalDivide,
		currentSession,
		horizontal,
		videos,
		aspects,
	]);

	const sizeFor = (k: string): TileSize => sizes[k] ?? { width: 0, height: 0 };
	const screenSize = sizeFor(SCREEN_KEY);
	const extraVideoSize = sizeFor(EXTRAVIDEO_KEY);
	const drawingSize = sizeFor(DRAWING_KEY);

	return (
		<SpotlightsDiv ref={peersRef} headless={headless ? 1 : 0} horizontal={horizontal ? 1 : 0} videos={videos ? 1 : 0}>
			{ !hideSelfView && screenEnabled && (
				<VideoBox
					order={2}
					width={screenSize.width}
					height={screenSize.height}
				>
					<VideoView
						source='screen'
						contain
						onAspectChange={(a) => setAspect(SCREEN_KEY, a)}
					/>
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
					width={extraVideoSize.width}
					height={extraVideoSize.height}
				>
					<VideoView
						source='extravideo'
						onAspectChange={(a) => setAspect(EXTRAVIDEO_KEY, a)}
					/>
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
					width={drawingSize.width}
					height={drawingSize.height}
				>
					<Suspense>
						<DrawingView width={drawingSize.width} height={drawingSize.height}/>
					</Suspense>
				</VideoBox>
			}

			{ videoConsumers.map((consumer) => (
				<VideoConsumer
					key={consumer.id}
					consumer={consumer}
					style={sizeFor(consumer.id)}
					onAspectChange={(a) => setAspect(consumer.id, a)}
				/>
			))}
		</SpotlightsDiv>
	);
};

export default Spotlights;

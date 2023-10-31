import { styled, useTheme } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { speakerVideoConsumersSelector, videoBoxesSelector } from '../../store/selectors';
import Me from '../me/Me';
import VideoConsumer from '../videoconsumer/VideoConsumer';
import Peers from '../peers/Peers';

type DemocraticDivProps = {
	headless: number;
};

const DemocraticDiv = styled('div')<DemocraticDivProps>(({
	theme,
	headless,
}) => ({
	width: '100%',
	height: headless ? 'calc(100% - 8px)' : 'calc(100% - 64px)',
	marginBottom: headless ? 0 : 64,
	display: 'flex',
	flexDirection: 'row',
	gap: theme.spacing(1),
	flexWrap: 'wrap',
	overflow: 'hidden',
	justifyContent: 'center',
	alignItems: 'center',
	alignContent: 'center',
}));

const Democratic = (): JSX.Element => {
	const theme = useTheme();
	const peersRef = useRef<HTMLDivElement>(null);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const verticalDivide = useAppSelector((state) => state.settings.verticalDivide);
	const chatOpen = useAppSelector((state) => state.ui.chatOpen);
	const participantListOpen = useAppSelector((state) => state.ui.participantListOpen);
	const boxes = useAppSelector(videoBoxesSelector);
	const speakerVideoConsumers = useAppSelector(speakerVideoConsumersSelector);
	const currentSession = useAppSelector((state) => state.me.sessionId);
	const headless = useAppSelector((state) => state.room.headless);
	const [ windowSize, setWindowSize ] = useState(0);
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

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout> | undefined;

		const resizeListener = () => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => setWindowSize(window.innerWidth + window.innerHeight), 50);
		};

		window.addEventListener('resize', resizeListener);
		updateDimensions();

		return () => {
			window.removeEventListener('resize', resizeListener);
			clearTimeout(timeoutId);
		};
	}, []);

	useEffect(() => updateDimensions(), [
		boxes,
		windowSize,
		hideSelfView,
		chatOpen,
		participantListOpen,
		verticalDivide,
		currentSession,
	]);

	const style = {
		width: dimensions.peerWidth,
		height: dimensions.peerHeight
	};

	return (
		<DemocraticDiv ref={peersRef} headless={headless ? 1 : 0}>
			<Me style={style} />
			{ speakerVideoConsumers.map((consumer) => (
				<VideoConsumer
					key={consumer.id}
					consumer={consumer}
					style={style}
				/>
			))}
			<Peers style={style} />
		</DemocraticDiv>
	);
};

export default Democratic;
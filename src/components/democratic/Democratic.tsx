import { styled, useTheme } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { spotlightPeersSelector, videoBoxesSelector } from '../../store/selectors';
import Me from '../me/Me';
import Peer from '../peer/Peer';

const DemocraticDiv = styled('div')(({
	theme
}) => ({
	width: '100%',
	height: 'calc(100% - 64px)',
	marginBottom: 64,
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
	const spotlightPeers = useAppSelector(spotlightPeersSelector);
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
	]);

	const style = {
		width: dimensions.peerWidth,
		height: dimensions.peerHeight
	};

	return (
		<DemocraticDiv ref={peersRef}>
			<Me style={style} />
			{ spotlightPeers.map((peerId) => (
				<Peer
					key={peerId}
					id={peerId}
					style={style}
				/>
			))}
		</DemocraticDiv>
	);
};

export default Democratic;
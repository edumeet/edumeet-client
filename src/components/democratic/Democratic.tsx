import { styled, useTheme } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { controlButtonsVisibleSelector, spotlightPeersSelector, videoBoxesSelector } from '../../store/selectors';
import Me from '../me/Me';
import Peer from '../peer/Peer';

interface DemocraticProps {
	controlbuttons?: number;
}

const DemocraticDiv = styled('div')<DemocraticProps>(({
	theme,
	controlbuttons
}) => ({
	width: '100%',
	height: '100%',
	display: 'flex',
	...(controlbuttons && {
		marginBottom: 64,
		height: 'calc(100% - 64px)',
	}),
	flexDirection: 'row',
	gap: theme.spacing(1),
	flexWrap: 'wrap',
	overflow: 'hidden',
	justifyContent: 'center',
	alignItems: 'center',
	alignContent: 'center',
	transition: 'margin-left 0.5s ease-in-out'
}));

const Democratic = (): JSX.Element => {
	const theme = useTheme();
	const peersRef = useRef<HTMLDivElement>(null);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);
	const controlButtonsBar = useAppSelector(controlButtonsVisibleSelector);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const chatOpen = useAppSelector((state) => state.ui.chatOpen);
	const participantListOpen = useAppSelector((state) => state.ui.participantListOpen);
	const boxes = useAppSelector(videoBoxesSelector);
	const spotlightPeers = useAppSelector(spotlightPeersSelector);
	const [ windowSize, setWindowSize ] = useState(0);
	const [ dimensions, setDimensions ] = useState<Record<'peerWidth' | 'peerHeight', number>>({ peerWidth: 320, peerHeight: 240 });

	const updateDimensions = (): void => {
		const { current } = peersRef;

		if (!current || !boxes)
			return;

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

			if (space < y)
				break;
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

			timeoutId = setTimeout(() => {
				setWindowSize(window.innerWidth + window.innerHeight);
	
				timeoutId = undefined;
			}, 50);
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
		controlButtonsBar,
		hideSelfView,
		chatOpen,
		participantListOpen
	]);

	const style = {
		width: dimensions.peerWidth,
		height: dimensions.peerHeight
	};

	return (
		<DemocraticDiv
			ref={peersRef}
			controlbuttons={(controlButtonsBar) ? 1 : 0}
		>
			<Me style={style} />
			{ spotlightPeers.map((peer) => (
				<Peer
					key={peer}
					id={peer}
					style={style}
				/>
			))}
		</DemocraticDiv>
	);
};

export default Democratic;
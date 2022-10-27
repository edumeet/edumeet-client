import { styled } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { spotlightPeersSelector, videoBoxesSelector } from '../../store/selectors';
import Me from '../me/Me';
import Peer from '../peer/Peer';

const PADDING_V = 64;
const FILL_RATE = 0.95;

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
		marginLeft: theme.spacing(8)
	}),
	flexDirection: 'row',
	flexWrap: 'wrap',
	overflow: 'hidden',
	justifyContent: 'center',
	alignItems: 'center',
	alignContent: 'center',
	paddingTop: PADDING_V,
	transition: 'margin-left 0.5s ease-in-out'
}));

const Democratic = (): JSX.Element => {
	const peersRef = useRef<HTMLDivElement>(null);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);
	const controlButtonsBar =
		useAppSelector((state) => state.settings.controlButtonsBar);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const boxes = useAppSelector(videoBoxesSelector);
	const spotlightPeers = useAppSelector(spotlightPeersSelector);
	const [ windowSize, setWindowSize ] = useState(0);
	const [ dimensions, setDimensions ] =
		useState<Record<'peerWidth' | 'peerHeight', number>>({ peerWidth: 320, peerHeight: 240 });

	const updateDimensions = (): void => {
		const { current } = peersRef;

		if (!current || !boxes)
			return;

		const width = current.clientWidth;
		const height = current.clientHeight - PADDING_V;

		let x = width;
		let y = height;
		let space;

		for (let rows = 1; rows <= boxes; rows = rows + 1) {
			x = width / Math.ceil(boxes / rows);
			y = x / aspectRatio;

			if (height < (y * rows)) {
				y = height / rows;
				x = aspectRatio * y;

				break;
			}

			space = height - (y * (rows));

			if (space < y)
				break;
		}

		const { peerWidth, peerHeight } = dimensions;
		const newWidth = Math.ceil(FILL_RATE * x);
		const newHeight = Math.ceil(FILL_RATE * y);

		if (peerWidth !== newWidth || peerHeight !== newHeight) {
			setDimensions({
				peerWidth: newWidth,
				peerHeight: newHeight
			});
		}
	};

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		const resizeListener = () => {
			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				setWindowSize(window.innerWidth + window.innerHeight);
	
				timeoutId = null;
			}, 250);
		};

		window.addEventListener('resize', resizeListener);

		updateDimensions();

		return () => {
			window.removeEventListener('resize', resizeListener);
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, []);

	useEffect(() => updateDimensions(), [
		boxes,
		windowSize,
		controlButtonsBar,
		hideSelfView
	]);

	const style = {
		width: dimensions.peerWidth,
		height: dimensions.peerHeight
	};

	return (
		<DemocraticDiv
			ref={peersRef}
			controlbuttons={(controlButtonsBar || hideSelfView) ? 1 : 0}
		>
			{ !hideSelfView && <Me style={style} spacing={1} /> }
			{ spotlightPeers.map((peer) => (
				<Peer
					key={peer}
					id={peer}
					spacing={1}
					style={style}
				/>
			))}
		</DemocraticDiv>
	);
};

export default Democratic;
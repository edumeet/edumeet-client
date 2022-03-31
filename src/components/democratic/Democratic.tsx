import { styled } from '@mui/material/styles';
import React, { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { spotlightPeersSelector, videoBoxesSelector } from '../../store/selectors';
import Me from '../me/Me';
import Peer from '../peer/Peer';

interface DemocraticProps {
	advancedMode?: boolean;
}

const DemocraticDiv = styled('div')({
	width: '100%',
	height: '100%',
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	overflow: 'hidden',
	justifyContent: 'center',
	alignItems: 'center',
	alignContent: 'center'
});

const FILL_RATE = 0.95;

const Democratic = ({
	advancedMode
}: DemocraticProps): JSX.Element => {
	const peersRef = useRef<HTMLDivElement>(null);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);
	const boxes = useAppSelector(videoBoxesSelector);
	const spotlightPeers = useAppSelector(spotlightPeersSelector);
	const [ dimensions, setDimensions ] =
		useState<Record<'peerWidth' | 'peerHeight', number>>({ peerWidth: 320, peerHeight: 240 });

	const updateDimensions = (): void => {
		// eslint-disable-next-line no-console
		console.log('updateDimensions');

		const { current } = peersRef;

		if (!current || !boxes)
			return;

		const width = current.clientWidth;
		const height = current.clientHeight;

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
			// eslint-disable-next-line no-console
			console.log('resize');

			timeoutId && clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				updateDimensions();

				timeoutId = null;
			}, 250);
		};

		window.addEventListener('resize', resizeListener);
		updateDimensions();

		return () => window.removeEventListener('resize', resizeListener);
	}, []);

	useEffect(() => updateDimensions, [ boxes ]);

	const style = {
		width: dimensions.peerWidth,
		height: dimensions.peerHeight
	};

	return (
		<DemocraticDiv ref={peersRef}>
			<Me style={style} spacing={1} />

			{ spotlightPeers.map((peer) => (
				<Peer
					key={peer}
					advancedMode={advancedMode}
					id={peer}
					spacing={1}
					style={style}
				/>
			))}
		</DemocraticDiv>
	);
};

export default Democratic;
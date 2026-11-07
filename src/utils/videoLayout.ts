// Decides whether the spotlights (screen shares, extra videos, the drawing
// board) and the participant videos go next to each other (row) or above
// each other (column).
//
// Both layouts are tried on the space the videos get, with the areas sized as
// their default styles size them (the participant videos 25rem across the
// layout axis, both shrinking to fit), and the one that shows the videos
// biggest wins. The spotlights are what people look at,
// so their area counts double. To keep the layout from flipping back and
// forth near the break-even point, it only changes when the other layout is
// clearly better.

// Default size of the participant video area across the layout axis, in px
// (25rem with the usual 16px root font size).
export const PARTICIPANT_VIDEOS_SIZE = 400;
// Space kept free below the videos for the control buttons bar.
export const CONTROLS_SPACE = 64;
// Smallest sizes the divider between the two areas leaves them, in px.
export const MIN_PARTICIPANT_VIDEOS_SIZE = 160;
export const MIN_SPOTLIGHTS_SIZE = 240;
// Gap between the two areas.
export const AREA_GAP = 4;
// Gap between tiles.
const TILE_GAP = 8;

const SPOTLIGHT_WEIGHT = 2;
// The other layout has to be this much better to switch to it.
const HYSTERESIS = 1.1;

// Total area of count tiles with the given aspect ratio in the best grid that
// fits in width x height.
export const tileArea = (count: number, width: number, height: number, aspectRatio: number): number => {
	if (count <= 0 || width <= 0 || height <= 0) return 0;

	let best = 0;

	for (let rows = 1; rows <= count; rows++) {
		const columns = Math.ceil(count / rows);
		const tileWidth = Math.min(
			(width - (columns * TILE_GAP)) / columns,
			((height - (rows * TILE_GAP)) / rows) * aspectRatio
		);

		if (tileWidth > 0)
			best = Math.max(best, count * tileWidth * (tileWidth / aspectRatio));
	}

	return best;
};

export interface VideoLayoutInput {
	// Space the videos get, in px.
	width: number;
	height: number;
	spotlights: number;
	videos: number;
	aspectRatio: number;
	headless?: boolean;
	// The layout used now; undefined when there is none yet.
	horizontal?: boolean;
	participantVideosSize?: number;
}

// Sizes of two flex items with these base sizes in the given space: when they
// do not fit, both shrink in proportion to their base size (flex-shrink: 1).
export const shrinkToFit = (space: number, first: number, second: number): [ number, number ] => {
	const overflow = first + second - space;

	if (overflow <= 0) return [ first, second ];

	const total = first + second;

	return [ first - (overflow * (first / total)), second - (overflow * (second / total)) ];
};

export const layoutScore = (
	{ width, height, spotlights, videos, aspectRatio, headless, participantVideosSize = PARTICIPANT_VIDEOS_SIZE }: VideoLayoutInput,
	horizontal: boolean
): number => {
	const controls = headless ? 0 : CONTROLS_SPACE;
	const size = participantVideosSize;
	let spotlightArea: number;
	let videoArea: number;

	// Mirrors the default styles of Spotlights and Democratic.
	if (horizontal) {
		// Spotlights 100% wide, participant videos 25rem, the gap between them;
		// both as high as the space minus the controls (8px when headless).
		const tileHeight = height - (headless ? TILE_GAP : controls);
		const [ spotlightWidth, videoWidth ] = shrinkToFit(width - AREA_GAP, width, size);

		spotlightArea = tileArea(spotlights, spotlightWidth, tileHeight, aspectRatio);
		videoArea = tileArea(videos, videoWidth, tileHeight, aspectRatio);
	} else {
		// Spotlights 100% - 8px high; participant videos 25rem minus the
		// controls (8px when headless), plus a margin for the controls that
		// does not shrink.
		const [ spotlightHeight, videoHeight ] = shrinkToFit(
			height - AREA_GAP - controls,
			height - TILE_GAP,
			size - (headless ? TILE_GAP : controls)
		);

		spotlightArea = tileArea(spotlights, width, spotlightHeight, aspectRatio);
		videoArea = tileArea(videos, width, videoHeight, aspectRatio);
	}

	return (SPOTLIGHT_WEIGHT * spotlightArea) + videoArea;
};

export const chooseHorizontal = (input: VideoLayoutInput): boolean => {
	const { width, height, spotlights, videos, aspectRatio, horizontal } = input;

	if (width <= 0 || height <= 0) return horizontal ?? true;

	// With only one kind of video there is nothing to arrange side by side;
	// keep the old rule based on the shape of the space.
	if (spotlights === 0 || videos === 0) return (width / height) > aspectRatio;

	const row = layoutScore(input, true);
	const column = layoutScore(input, false);

	if (horizontal === undefined) return row >= column;

	return horizontal ?
		!(column > row * HYSTERESIS) :
		row > column * HYSTERESIS;
};

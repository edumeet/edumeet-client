// Decides whether the spotlights (screen shares, extra videos, the drawing
// board) and the participant videos go next to each other (row) or above
// each other (column).
//
// Both layouts are tried on the space the videos get, using the default size
// of the participant video area (25rem across the layout axis), and the one
// that shows the videos biggest wins. The spotlights are what people look at,
// so their area counts double. To keep the layout from flipping back and
// forth near the break-even point, it only changes when the other layout is
// clearly better.

// Default size of the participant video area across the layout axis, in px
// (25rem with the usual 16px root font size).
export const PARTICIPANT_VIDEOS_SIZE = 400;
// Space kept free below the videos for the control buttons bar.
export const CONTROLS_SPACE = 64;
// Gap between tiles, and between the two areas.
const TILE_GAP = 8;
const AREA_GAP = 4;

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

export const layoutScore = (
	{ width, height, spotlights, videos, aspectRatio, headless, participantVideosSize = PARTICIPANT_VIDEOS_SIZE }: VideoLayoutInput,
	horizontal: boolean
): number => {
	const controls = headless ? 0 : CONTROLS_SPACE;
	const size = participantVideosSize;

	// Mirrors the styles of Spotlights and Democratic in each layout.
	const spotlightArea = horizontal ?
		tileArea(spotlights, width - size - AREA_GAP, height - controls, aspectRatio) :
		tileArea(spotlights, width, height - size - AREA_GAP - TILE_GAP, aspectRatio);
	const videoArea = horizontal ?
		tileArea(videos, size, height - controls, aspectRatio) :
		tileArea(videos, width, size - controls, aspectRatio);

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

import { green, grey, lightGreen, orange, red, yellow } from '@mui/material/colors';
import { describeQualityKey } from './qualityExplanations';

/**
 * `@observertc/client-monitor-js` calculates every score (client, peer
 * connection and track level) on a 0..5 scale, where 5 is flawless.
 */
export const MAX_SCORE = 5;

export type ScoreReason = {
	key: string;
	label: string;
	penalty: number;
	description?: string;
};

export type QualityIssue = {
	key: string;
	label: string;
	description?: string;
};

export const scoreColor = (score?: number): string => {
	if (score === undefined || Number.isNaN(score)) return grey[400];
	if (score >= 4.5) return green[400];
	if (score >= 3.5) return lightGreen[400];
	if (score >= 2.5) return yellow[600];
	if (score >= 1.5) return orange[400];

	return red[400];
};

/** How many of the five bars should be lit for a score. */
export const scoreBars = (score?: number): number => {
	if (score === undefined || Number.isNaN(score)) return 0;

	return Math.max(0, Math.min(MAX_SCORE, Math.round(score)));
};

export const formatScore = (score?: number): string => (
	score === undefined || Number.isNaN(score) ? 'n/a' : score.toFixed(1)
);

/**
 * Score reason keys come straight from the score calculator, so they are
 * library defined identifiers such as `highJitter` or `dropped-frames`.
 * They are humanized generically instead of being mapped one by one, so new
 * reasons introduced by the library still render sensibly.
 */
export const humanizeReasonKey = (key: string): string => {
	const words = key
		.replace(/[_-]+/g, ' ')
		.replace(/([a-z\d])([A-Z])/g, '$1 $2')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();

	if (!words) return key;

	return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};

/**
 * Turns the `scoreReasons` record into a list ordered by how much each reason
 * subtracted from the score. Zero (or negative) penalties are dropped, they
 * carry no information for the user.
 */
export const toScoreReasons = (reasons?: Record<string, number>): ScoreReason[] => {
	if (!reasons) return [];

	return Object.entries(reasons)
		.filter(([ , penalty ]) => typeof penalty === 'number' && penalty > 0)
		.sort(([ , a ], [ , b ]) => b - a)
		.map(([ key, penalty ]) => ({
			key,
			label: humanizeReasonKey(key),
			penalty,
			description: describeQualityKey(key),
		}));
};

/** Turns raw issue types into displayable issues, keeping the key for lookups. */
export const toQualityIssues = (types: Iterable<string>): QualityIssue[] =>
	Array.from(new Set(Array.from(types))).map((key) => ({
		key,
		label: humanizeReasonKey(key),
		description: describeQualityKey(key),
	}));

import { SignalCellular0Bar, SignalCellular1Bar, SignalCellular2Bar, SignalCellular3Bar, SignalCellular4Bar, SignalCellularAlt } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { MAX_SCORE, QualityIssue, ScoreReason, formatScore, scoreColor } from './qualityScore';

export type QualityBadgeSize = 'inherit' | 'small' | 'medium' | 'large';

interface QualityBadgeProps {
	// Score on the monitor's 0..5 scale, undefined when it is not known (yet).
	score?: number;
	// Reasons the score was reduced, rendered in the tooltip.
	reasons?: ScoreReason[];
	// Active issues, rendered in the tooltip with their explanation.
	issues?: QualityIssue[];
	// Stay hidden while the quality is good. Defaults to true.
	hideWhenGood?: boolean;
	fontSize?: QualityBadgeSize;
	placement?: 'top' | 'bottom' | 'left' | 'right';
}

const GOOD_SCORE_THRESHOLD = 4;

const Explanation = styled('div')(({ theme }) => ({
	opacity: 0.8,
	paddingLeft: theme.spacing(1),
	paddingBottom: theme.spacing(0.5),
	maxWidth: '22rem',
}));

const iconForScore = (score: number | undefined, fontSize: QualityBadgeSize): React.JSX.Element => {
	const color = scoreColor(score);

	// Nothing scored yet but something is wrong: report it without pretending to
	// know how bad it is.
	if (score === undefined || Number.isNaN(score)) return <SignalCellularAlt fontSize={fontSize} style={{ color: red[400] }} />;
	if (score < 1) return <SignalCellular0Bar fontSize={fontSize} style={{ color }} />;
	if (score < 2) return <SignalCellular1Bar fontSize={fontSize} style={{ color }} />;
	if (score < 3) return <SignalCellular2Bar fontSize={fontSize} style={{ color }} />;
	if (score < 4) return <SignalCellular3Bar fontSize={fontSize} style={{ color }} />;

	return <SignalCellular4Bar fontSize={fontSize} style={{ color }} />;
};

/**
 * Inline quality badge: a signal icon coloured by the client monitor's score,
 * explaining in its tooltip what is dragging that score down.
 *
 * It renders nothing while everything is fine, so it reads as a warning rather
 * than as permanent chrome. It is deliberately position-less - the caller (top
 * bar, participant list) decides where it sits, and it is never laid over a
 * video tile where a recording would capture it.
 */
const QualityBadge = ({
	score,
	reasons = [],
	issues = [],
	hideWhenGood = true,
	fontSize = 'small',
	placement = 'bottom',
}: QualityBadgeProps): React.JSX.Element => {
	const hasScore = score !== undefined && !Number.isNaN(score);

	if (!hasScore && issues.length === 0) return <></>;
	if (hideWhenGood && issues.length === 0 && score !== undefined && score >= GOOD_SCORE_THRESHOLD) return <></>;

	const tooltip = (
		<>
			{ hasScore && <div><b>Quality {formatScore(score)}/{MAX_SCORE}</b></div> }
			{ reasons.map((reason) => (
				<div key={reason.key}>
					<div>− {reason.label} ({reason.penalty.toFixed(2)})</div>
					{ reason.description && <Explanation>{reason.description}</Explanation> }
				</div>
			)) }
			{ issues.map((issue) => (
				<div key={issue.key}>
					<div>! {issue.label}</div>
					{ issue.description && <Explanation>{issue.description}</Explanation> }
				</div>
			)) }
		</>
	);

	return (
		<Tooltip title={tooltip} placement={placement}>
			{ iconForScore(score, fontSize) }
		</Tooltip>
	);
};

export default QualityBadge;

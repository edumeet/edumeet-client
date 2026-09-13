import { ReactNode } from 'react';
import { Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MAX_SCORE, QualityIssue, ScoreReason, formatScore, scoreBars, scoreColor } from './qualityScore';

const Wrapper = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
});

const ScoreRow = styled('div')(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	gap: theme.spacing(0.5),
}));

const Bars = styled('div')({
	display: 'flex',
	alignItems: 'flex-end',
	gap: '1px',
	height: '0.75rem',
});

type BarProps = { lit: number, index: number, litcolor: string };

const Bar = styled('span')<BarProps>(({ lit, index, litcolor }) => ({
	display: 'block',
	width: '3px',
	height: `${40 + (index * 15)}%`,
	backgroundColor: lit ? litcolor : 'rgba(255, 255, 255, 0.25)',
}));

const ReasonList = styled('ul')(({ theme }) => ({
	margin: theme.spacing(0.25, 0, 0, 0),
	paddingLeft: theme.spacing(1.5),
	listStyleType: 'none',
}));

const ReasonItem = styled('li')({
	opacity: 0.85,
	'&::before': {
		content: '"− "',
	},
});

const IssueItem = styled('li')(({ theme }) => ({
	color: theme.palette.error.light,
	'&::before': {
		content: '"! "',
	},
}));

// Only the text carries the "hover me" affordance, so the marker before it is
// not underlined.
const Explained = styled('span')({
	textDecoration: 'underline dotted',
	textUnderlineOffset: '2px',
	cursor: 'help',
});

/** Wraps a label in a tooltip when there is something to explain. */
const WithExplanation = ({
	description,
	children,
}: { description?: string, children: ReactNode }): React.JSX.Element => {
	if (!description) return <>{children}</>;

	return (
		<Tooltip title={description} placement='right'>
			<Explained>{children}</Explained>
		</Tooltip>
	);
};

interface ScoreSectionProps {
	title?: string;
	score?: number;
	reasons?: ScoreReason[];
	issues?: QualityIssue[];
}

/**
 * Renders one score with the reasons that pulled it down, plus any issue
 * currently active on the same monitor. This is the part of the quality window
 * that answers "why is this bad", not just "how bad is it" - hovering a reason
 * or an issue explains what it actually means.
 */
const ScoreSection = ({
	title,
	score,
	reasons = [],
	issues = [],
}: ScoreSectionProps): React.JSX.Element => {
	const lit = scoreBars(score);
	const color = scoreColor(score);

	return (
		<Wrapper>
			<ScoreRow>
				{ title && <b>{title}</b> }
				<Bars>
					{ Array.from({ length: MAX_SCORE }).map((_bar, index) => (
						<Bar key={index} index={index} lit={index < lit ? 1 : 0} litcolor={color} />
					)) }
				</Bars>
				<span style={{ color }}>{formatScore(score)}</span>
			</ScoreRow>
			{ (reasons.length > 0 || issues.length > 0) && (
				<ReasonList>
					{ reasons.map((reason) => (
						<ReasonItem key={reason.key}>
							<WithExplanation description={reason.description}>
								{reason.label} ({reason.penalty.toFixed(2)})
							</WithExplanation>
						</ReasonItem>
					)) }
					{ issues.map((issue) => (
						<IssueItem key={issue.key}>
							<WithExplanation description={issue.description}>
								{issue.label}
							</WithExplanation>
						</IssueItem>
					)) }
				</ReasonList>
			) }
		</Wrapper>
	);
};

export default ScoreSection;

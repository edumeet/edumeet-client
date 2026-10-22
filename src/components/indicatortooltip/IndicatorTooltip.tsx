import { Tooltip, TooltipProps } from '@mui/material';

/**
 * Tooltip for passive indicators, which have no click action and explain
 * themselves only through the tooltip. MUI opens a tooltip on touch after a
 * 700 ms long press and hides it after 1.5 s, which on a phone means the
 * explanation is never seen; here a tap opens it and it stays long enough to
 * read a few lines.
 */
const IndicatorTooltip = (props: TooltipProps): React.JSX.Element => (
	<Tooltip enterTouchDelay={0} leaveTouchDelay={6000} {...props} />
);

export default IndicatorTooltip;

import { useContext } from 'react';
import { Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { NetworkCheck } from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import { ServiceContext } from '../../store/store';
import { OWN_PROBLEM_GRACE_ROUNDS, graceMs, useSustained } from '../../utils/useSustained';
import { ownProblemLabel } from '../translated/translatedComponents';
import { useOwnProblem } from './useProblems';

const Detail = styled('div')({
	opacity: 0.85,
	maxWidth: '22rem',
});

/**
 * Top bar mark for a problem on this user's own side of the call: something
 * they can act on, named with what to do. It appears only after the problem
 * has outlasted a few stats rounds, takes the app bar colour like every icon
 * there, and is not a control: it indicates, the quality window explains.
 */
const OwnProblemIndicator = (): React.JSX.Element => {
	useAppSelector((state) => state.settings.locale);

	const { mediaService } = useContext(ServiceContext);
	const problem = useOwnProblem();
	const sustained = useSustained(Boolean(problem), graceMs(mediaService.monitor, OWN_PROBLEM_GRACE_ROUNDS));

	if (!problem || !sustained) return <></>;

	const hint = ownProblemLabel(problem.kind);

	const title = (
		<>
			<div><b>{ hint }</b></div>
			{ problem.issues.map((issue) => (
				<Detail key={issue.key}>{ issue.description ?? issue.label }</Detail>
			)) }
			{ problem.reasons.map((reason) => (
				<Detail key={reason.key}>{ reason.description ?? reason.label }</Detail>
			)) }
		</>
	);

	return (
		<Tooltip title={title} placement='bottom'>
			<NetworkCheck fontSize='medium' role='img' aria-label={hint} />
		</Tooltip>
	);
};

export default OwnProblemIndicator;

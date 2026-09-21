import { Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { memo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { disclosedKinds } from '../../utils/botJobs';
import { botJobRunningLabel } from '../../utils/botJobLabels';
import { botJobInterruptedLabel } from '../translated/translatedComponents';
import { botJobIcons } from '../menuitems/BotJob';

const Holder = styled('span')(({ theme }) => ({
	display: 'inline-flex',
	alignItems: 'center',
	marginRight: theme.spacing(0.5),
}));

// Icons in the top bar all take the colour of the bar. The recording dot is the one
// exception, and its border in that colour keeps it readable on any bar.
const RecordingDot = styled('span')(({ theme }) => ({
	boxSizing: 'border-box',
	width: 16,
	height: 16,
	margin: 4,
	borderRadius: '50%',
	backgroundColor: theme.palette.error.main,
	border: `2px solid ${theme.appBarIconColor}`,
	animation: 'botJobBlink 1.5s ease-in-out infinite alternate',
	'@keyframes botJobBlink': {
		from: { opacity: 1 },
		to: { opacity: 0.35 },
	},
}));

// A job whose bot is away keeps its icon, dimmed, until the bot is back or the job fails.
const Dimmed = styled('span')({
	display: 'inline-flex',
	opacity: 0.45,
});

// Tells everyone in the room what is being done with the meeting. One icon per
// kind of job, however many bots run it: a blinking red dot while the meeting is
// recorded, and the icon of the kind for a live stream or a transcription.
const BotJobIcons = (): React.JSX.Element | null => {
	useAppSelector((state) => state.settings.locale);
	const jobs = useAppSelector((state) => state.botJobs.jobs);
	const kinds = disclosedKinds(jobs);

	if (kinds.length === 0) return null;

	return (
		<>
			{ kinds.map(({ type, running, label }) => {
				const Icon = botJobIcons[type];
				const title = running ? botJobRunningLabel(type) : botJobInterruptedLabel(label);

				return (
					<Tooltip key={type} title={title}>
						<Holder aria-label={title} data-bot-job={type} data-bot-job-state={running ? 'running' : 'interrupted'}>
							{ running ?
								(type === 'recorder' ? <RecordingDot /> : <Icon />) :
								<Dimmed><Icon /></Dimmed>
							}
						</Holder>
					</Tooltip>
				);
			}) }
		</>
	);
};

export default memo(BotJobIcons);

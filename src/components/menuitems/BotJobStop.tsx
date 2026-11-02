import { MenuItem } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { stopBotJob } from '../../store/actions/botJobActions';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { BotJobType } from '../../utils/botJobs';
import { botJobStopKindLabel } from '../../utils/botJobLabels';
import { botJobIcons } from './BotJob';

interface BotJobStopProps extends MenuItemProps {
	type: BotJobType;
	jobId: string;
}

// The same as Stop in the bot menu: the provider is asked to finish the job properly.
const BotJobStop = ({ type, jobId, onClick }: BotJobStopProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const Icon = botJobIcons[type];
	const label = botJobStopKindLabel(type);

	return (
		<MenuItem
			aria-label={label}
			onClick={() => {
				onClick();
				dispatch(stopBotJob(jobId));
			}}
		>
			<Icon color='error' />
			<MoreActions>{ label }</MoreActions>
		</MenuItem>
	);
};

export default BotJobStop;

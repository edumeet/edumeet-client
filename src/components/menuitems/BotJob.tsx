import { MenuItem } from '@mui/material';
import RecordIcon from '@mui/icons-material/RadioButtonChecked';
import StreamIcon from '@mui/icons-material/Podcasts';
import TranscribeIcon from '@mui/icons-material/SubtitlesOutlined';
import { useAppDispatch } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { BotJobType } from '../../utils/botJobs';
import { botJobStartLabel } from '../../utils/botJobLabels';

export const botJobIcons = {
	recorder: RecordIcon,
	streamer: StreamIcon,
	transcriber: TranscribeIcon,
};

interface BotJobProps extends MenuItemProps {
	type: BotJobType;
}

// Only asks; the job is started from the confirmation this opens.
const BotJob = ({ type, onClick }: BotJobProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const Icon = botJobIcons[type];
	const label = botJobStartLabel(type);

	return (
		<MenuItem
			aria-label={label}
			onClick={() => {
				onClick();
				dispatch(uiActions.setUi({ botJobDialog: type }));
			}}
		>
			<Icon />
			<MoreActions>{ label }</MoreActions>
		</MenuItem>
	);
};

export default BotJob;

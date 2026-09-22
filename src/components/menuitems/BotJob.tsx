import { MenuItem, Tooltip } from '@mui/material';
import RecordIcon from '@mui/icons-material/RadioButtonChecked';
import StreamIcon from '@mui/icons-material/Podcasts';
import TranscribeIcon from '@mui/icons-material/SubtitlesOutlined';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { BotJobType } from '../../utils/botJobs';
import { botJobStartLabel } from '../../utils/botJobLabels';
import { botJobLoginToRecordLabel } from '../translated/translatedComponents';

export const botJobIcons = {
	recorder: RecordIcon,
	streamer: StreamIcon,
	transcriber: TranscribeIcon,
};

interface BotJobProps extends MenuItemProps {
	type: BotJobType;
}

// Only asks; the job is started from the confirmation this opens. A recording is
// delivered to people by their accounts, so it takes someone signed in to start one;
// the entry stays visible for a moderator who is not, and says what to do.
const BotJob = ({ type, onClick }: BotJobProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const Icon = botJobIcons[type];
	const label = botJobStartLabel(type);

	// Not the `disabled` prop: that turns pointer events off, and the tooltip with them.
	return (
		<Tooltip title={loggedIn ? '' : botJobLoginToRecordLabel()} placement='left'>
			<MenuItem
				aria-label={label}
				aria-disabled={!loggedIn}
				sx={loggedIn ? undefined : { opacity: (theme) => theme.palette.action.disabledOpacity, cursor: 'default' }}
				onClick={() => {
					if (!loggedIn) return;

					onClick();
					dispatch(uiActions.setUi({ botJobDialog: type }));
				}}
			>
				<Icon />
				<MoreActions>{ label }</MoreActions>
			</MenuItem>
		</Tooltip>
	);
};

export default BotJob;

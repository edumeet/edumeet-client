import { Box, Chip, List, ListItem, ListItemText, Popover, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { memo, useState } from 'react';
import { useAppDispatch, useAppSelector, usePermissionSelector } from '../../store/hooks';
import { botsSelector } from '../../store/selectors';
import { kickPeer } from '../../store/actions/peerActions';
import { stopBotJob } from '../../store/actions/botJobActions';
import { permissions } from '../../utils/roles';
import { botJobStateLabel } from '../../utils/botJobLabels';
import { botMenu } from '../../utils/botJobs';
import ConfirmButton from '../textbuttons/ConfirmButton';
import {
	botJobStopConfirmLabel,
	botJobStopLabel,
	botJobStopTitleLabel,
	botsInRoomLabel,
	kickLabel,
	removeBotConfirmLabel,
	removeBotLabel,
	removeBotsConfirmLabel,
	removeBotsLabel,
} from '../translated/translatedComponents';

// Carries its own spacing so the top bar has nothing to lay out when there are no bots.
const StyledChip = styled(Chip)(({ theme }) => ({
	marginRight: theme.spacing(1),
	color: 'white',
	backgroundColor: 'rgba(128, 128, 128, 0.5)',
	'& .MuiChip-icon': {
		color: 'white',
	},
}));

const Panel = styled(Box)(({ theme }) => ({
	padding: theme.spacing(2),
	minWidth: 280,
}));

const Row = styled(ListItem)(({ theme }) => ({
	gap: theme.spacing(2),
}));

// Recorder and streamer pages are kept out of the participant list and the
// count, so this is the one place that discloses them: how many, and who. It is
// also where a moderator ends them: a bot that runs a job is stopped through its
// provider, which lets the job finish properly, and only a job that is already
// stopping, or a bot that was started by hand, is removed outright.
const BotsIndicator = (): React.JSX.Element | null => {
	useAppSelector((state) => state.settings.locale);
	const dispatch = useAppDispatch();
	const bots = useAppSelector(botsSelector);
	const jobs = useAppSelector((state) => state.botJobs.jobs);
	const canModerate = usePermissionSelector(permissions.MODERATE_ROOM);
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);

	// A moderator also sees a job whose bot has not arrived yet, to be able to stop it.
	if (bots.length === 0 && !(canModerate && jobs.length > 0)) return null;

	const nameOf = (bot: { id: string, displayName?: string }): string => bot.displayName || bot.id;

	if (!canModerate) {
		return (
			<Tooltip title={`${botsInRoomLabel()}: ${bots.map(nameOf).join(', ')}`}>
				<StyledChip size='small' icon={<SmartToyOutlinedIcon />} label={bots.length} />
			</Tooltip>
		);
	}

	const { plainBots, stoppableJobIds, kickablePeerIds } = botMenu(bots, jobs);
	// Stopping goes through the provider and the room server takes that only from someone
	// signed in; anyone else who moderates can still remove the bots outright.
	const canStop = loggedIn;

	const remove = (ids: string[]): void => {
		setAnchorEl(null);
		ids.forEach((id) => dispatch(kickPeer(id)));
	};

	const stop = (ids: string[]): void => {
		setAnchorEl(null);
		ids.forEach((id) => dispatch(stopBotJob(id)));
	};

	const removeAll = (): void => {
		if (canStop) {
			stop(stoppableJobIds);
			remove(kickablePeerIds);
		} else remove(bots.map((bot) => bot.id));
	};

	return (
		<>
			<Tooltip title={botsInRoomLabel()}>
				<StyledChip
					size='small'
					icon={<SmartToyOutlinedIcon />}
					label={bots.length}
					onClick={(event) => setAnchorEl(event.currentTarget)}
				/>
			</Tooltip>
			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				transformOrigin={{ vertical: 'top', horizontal: 'center' }}
			>
				<Panel>
					<Typography variant='subtitle2'>{ botsInRoomLabel() }</Typography>
					<List dense>
						{ jobs.map((job) => (
							<Row key={job.id} disableGutters data-bot-job-row={job.type}>
								<ListItemText primary={job.label} secondary={botJobStateLabel(job.state)} />
								{ job.state === 'stopping' || !canStop ?
									job.peerId && <ConfirmButton
										size='small'
										variant='outlined'
										label={kickLabel()}
										confirmTitle={removeBotLabel(job.label)}
										confirmContent={<Typography>{ removeBotConfirmLabel(job.label) }</Typography>}
										onConfirm={() => remove([ job.peerId as string ])}
									/> :
									<ConfirmButton
										size='small'
										variant='outlined'
										label={botJobStopLabel()}
										confirmTitle={botJobStopTitleLabel(job.label)}
										confirmContent={<Typography>{ botJobStopConfirmLabel(job.label) }</Typography>}
										onConfirm={() => stop([ job.id ])}
									/>
								}
							</Row>
						)) }
						{ plainBots.map((bot) => (
							<Row key={bot.id} disableGutters>
								<ListItemText primary={nameOf(bot)} />
								<ConfirmButton
									size='small'
									variant='outlined'
									label={kickLabel()}
									confirmTitle={removeBotLabel(nameOf(bot))}
									confirmContent={<Typography>{ removeBotConfirmLabel(nameOf(bot)) }</Typography>}
									onConfirm={() => remove([ bot.id ])}
								/>
							</Row>
						)) }
					</List>
					{ jobs.length + plainBots.length > 1 &&
						<ConfirmButton
							size='small'
							label={removeBotsLabel()}
							confirmContent={<Typography>{ removeBotsConfirmLabel() }</Typography>}
							onConfirm={removeAll}
						/>
					}
				</Panel>
			</Popover>
		</>
	);
};

export default memo(BotsIndicator);

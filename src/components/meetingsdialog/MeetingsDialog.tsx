import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	IconButton,
	List,
	ListItem,
	ListItemText,
	Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Close } from '@mui/icons-material';
import { rrulestr } from 'rrule';
import GenericDialog from '../genericdialog/GenericDialog';
import { useAppDispatch } from '../../store/hooks';
import { getData } from '../../store/actions/managementActions';
import { Meeting } from '../../utils/types';
import edumeetConfig from '../../utils/edumeetConfig';
import {
	closeLabel,
	joinLabel,
	manageMeetingsLabel,
	noUpcomingMeetingsLabel,
	refreshLabel,
	upcomingMeetingsLabel
} from '../translated/translatedComponents';

const nextOccurrence = (m: Meeting): number => {
	const now = Date.now();
	// Coerce — Postgres bigint comes back as string; Date/rrule would misparse.
	const startsAt = Number(m.startsAt);

	if (!m.rrule) return startsAt >= now ? startsAt : 0;
	try {
		const rule = rrulestr(m.rrule, { dtstart: new Date(startsAt) });
		const next = rule.after(new Date(now), true);

		return next ? next.getTime() : 0;
	} catch {
		return startsAt >= now ? startsAt : 0;
	}
};

export interface MeetingsDialogProps {
	open: boolean;
	onClose: () => void;
}

const MeetingsDialog = ({ open, onClose }: MeetingsDialogProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const [ meetings, setMeetings ] = useState<Meeting[]>([]);
	const [ loading, setLoading ] = useState(false);

	const fetchMeetings = async () => {
		setLoading(true);
		try {
			const res = await dispatch(getData('meetings', { upcomingForMe: true }));

			if (res && typeof res === 'object' && 'data' in res) {
				setMeetings((res as { data: Meeting[] }).data);
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (open) fetchMeetings();
	}, [ open ]);

	const upcoming = meetings
		.map((m) => ({ meeting: m, next: nextOccurrence(m) }))
		.filter((x) => x.next > 0)
		.sort((a, b) => a.next - b.next)
		.slice(0, 20);

	const handleJoin = (roomName: string) => {
		onClose();
		window.location.href = `/${roomName}`;
	};

	const handleOpenManagement = () => {
		// Use edumeetConfig.managementUrl verbatim. The operator is expected to configure
		// the correct full URL (absolute or relative) in public/config/config.js. No
		// guessing, no port stripping — whatever's in the config is what opens.
		const base = edumeetConfig.managementUrl;

		if (!base) return;
		const sep = base.includes('?') ? '&' : '?';

		window.open(`${base}${sep}section=meetings`, '_blank', 'noopener,noreferrer');
	};

	return (
		<GenericDialog
			open={open}
			onClose={onClose}
			maxWidth='sm'
			title={
				<Box display='flex' alignItems='center' justifyContent='space-between'>
					<Typography variant='h6'>{upcomingMeetingsLabel()}</Typography>
					<IconButton onClick={fetchMeetings} aria-label={refreshLabel()} disabled={loading}>
						<RefreshIcon />
					</IconButton>
				</Box>
			}
			content={
				upcoming.length === 0 ? (
					<Box sx={{ py: 3, textAlign: 'center' }}>
						<Typography variant='body2' color='text.secondary'>
							{noUpcomingMeetingsLabel()}
						</Typography>
					</Box>
				) : (
					<List sx={{ maxHeight: 360, overflow: 'auto' }}>
						{upcoming.map(({ meeting, next }) => {
							const rName = meeting.room?.name ?? '';
							// End = next occurrence's start + duration (endsAt - startsAt).
							// Postgres bigint serialized as string, so coerce.
							const duration = Number(meeting.endsAt) - Number(meeting.startsAt);
							const nextEnd = next + (Number.isFinite(duration) && duration > 0 ? duration : 0);
							const startDate = new Date(next);
							const endDate = new Date(nextEnd);
							// Same calendar day → show just the end time, not the full date again.
							const sameDay = startDate.toDateString() === endDate.toDateString();
							const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
							const startStr = startDate.toLocaleString();
							const endStr = sameDay
								? endDate.toLocaleTimeString(undefined, timeOpts)
								: endDate.toLocaleString();

							return (
								<ListItem
									key={meeting.id}
									secondaryAction={
										<Button
											variant='contained'
											size='small'
											onClick={() => handleJoin(rName)}
											disabled={!rName}
										>
											{joinLabel()}
										</Button>
									}
								>
									<ListItemText
										primary={meeting.title}
										secondary={`${startStr} – ${endStr} — ${rName}`}
									/>
								</ListItem>
							);
						})}
					</List>
				)
			}
			actions={
				<Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
					<Button
						startIcon={<OpenInNewIcon />}
						onClick={handleOpenManagement}
						size='small'
						disabled={!edumeetConfig.managementUrl}
					>
						{manageMeetingsLabel()}
					</Button>
					<Button
						onClick={onClose}
						startIcon={<Close />}
						variant='contained'
						size='small'
					>
						{closeLabel()}
					</Button>
				</Box>
			}
		/>
	);
};

export default MeetingsDialog;

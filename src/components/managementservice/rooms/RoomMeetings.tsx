import { useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { useMRTLocalization } from '../../../utils/mrtLocalization';
import {
	Autocomplete,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment, { Moment } from 'moment';
import { RoomProp } from './Room';
import { Meeting, MeetingAttendee, MeetingPartstat, User } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { localeList } from '../../../utils/intlManager';
import { browserTimezone, timezoneOptions } from '../../../utils/timezones';
import { ensureMomentLocale, toMomentLocale } from '../../../utils/momentLocale';
import {
	createData,
	deleteData,
	getData,
	getDataByRoomId,
	getUserByEmail,
	patchData,
	persistResolvedUser
} from '../../../store/actions/managementActions';
import {
	addAttendeeLabel,
	addNewLabel,
	applyLabel,
	attendeesLabel,
	cancelLabel,
	deleteLabel,
	descLabel,
	endsAtLabel,
	inviteLanguageLabel,
	meetingsLabel,
	partstatAcceptedLabel,
	partstatDeclinedLabel,
	partstatNeedsActionLabel,
	partstatTentativeLabel,
	repeatDailyLabel,
	repeatIntervalLabel,
	repeatMonthlyLabel,
	repeatNeverLabel,
	repeatWeeklyLabel,
	repeatCountLabel,
	repeatsLabel,
	scheduleMeetingLabel,
	selectButtonLabel,
	startsAtLabel,
	timezoneLabel,
	titleLabel,
	userEmailLabel
} from '../../translated/translatedComponents';

type RepeatMode = 'NEVER' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

// Maps a UI locale code to a translation file code; falls back to "en".
// Server-side template lookup also falls back to English when no template exists.
const mapUiLocaleToFile = (uiLocale: string | undefined): string => {
	if (!uiLocale) return 'en';
	const normalized = uiLocale.toLowerCase();
	const lang = normalized.split('-')[0];
	const entry = localeList.find((l) => l.locale.some((loc) => loc === normalized || loc === lang));

	return entry?.file ?? 'en';
};

const partstatLabel = (p?: MeetingPartstat): string => {
	switch (p) {
		case 'ACCEPTED': return partstatAcceptedLabel();
		case 'DECLINED': return partstatDeclinedLabel();
		case 'TENTATIVE': return partstatTentativeLabel();
		default: return partstatNeedsActionLabel();
	}
};

const partstatColor = (p?: MeetingPartstat): 'success' | 'error' | 'warning' | 'default' => {
	switch (p) {
		case 'ACCEPTED': return 'success';
		case 'DECLINED': return 'error';
		case 'TENTATIVE': return 'warning';
		default: return 'default';
	}
};

const buildRrule = (mode: RepeatMode, interval: number, count: number): string | undefined => {
	if (mode === 'NEVER') return undefined;

	return `FREQ=${mode};INTERVAL=${Math.max(1, interval)};COUNT=${Math.max(1, count)}`;
};

const parseRrule = (rrule?: string): { mode: RepeatMode, interval: number, count: number } => {
	if (!rrule) return { mode: 'NEVER', interval: 1, count: 10 };
	const parts: Record<string, string> = {};

	rrule.split(';').forEach((p) => {
		const [ k, v ] = p.split('=');

		if (k) parts[k.toUpperCase()] = v;
	});
	const freq = (parts.FREQ ?? 'NEVER') as RepeatMode;
	const mode: RepeatMode = freq === 'DAILY' || freq === 'WEEKLY' || freq === 'MONTHLY' ? freq : 'NEVER';

	return {
		mode,
		interval: parseInt(parts.INTERVAL ?? '1', 10) || 1,
		count: parseInt(parts.COUNT ?? '10', 10) || 10
	};
};

const RoomMeetingsTable = (props: RoomProp) => {
	const roomId = props.roomId;
	const dispatch = useAppDispatch();
	const localization = useMRTLocalization();
	const uiLocale = useAppSelector((state) => state.settings.locale);
	const defaultLocale = mapUiLocaleToFile(uiLocale);
	const momentLocale = toMomentLocale(defaultLocale);

	useEffect(() => { ensureMomentLocale(defaultLocale); }, [ defaultLocale ]);

	const [ data, setData ] = useState<Meeting[]>([]);
	const [ users, setUsers ] = useState<User[]>([]);
	const [ isLoading, setIsLoading ] = useState(false);

	const [ open, setOpen ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ title, setTitle ] = useState('');
	const [ description, setDescription ] = useState('');
	const [ startsAt, setStartsAt ] = useState<Moment | null>(moment()
		.add(1, 'hour')
		.startOf('hour'));
	const [ endsAt, setEndsAt ] = useState<Moment | null>(moment()
		.add(2, 'hour')
		.startOf('hour'));
	const [ timezone, setTimezone ] = useState(browserTimezone());
	const [ locale, setLocale ] = useState(defaultLocale);
	const [ repeatMode, setRepeatMode ] = useState<RepeatMode>('NEVER');
	const [ repeatInterval, setRepeatInterval ] = useState(1);
	const [ repeatCount, setRepeatCount ] = useState(10);
	const [ attendees, setAttendees ] = useState<MeetingAttendee[]>([]);
	const [ attendeeInput, setAttendeeInput ] = useState<User | string | null>(null);
	const [ resolveEmail, setResolveEmail ] = useState('');
	const [ isResolving, setIsResolving ] = useState(false);
	const [ resolveError, setResolveError ] = useState<string | null>(null);

	const fetchAll = async () => {
		setIsLoading(true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const meetings: any = await dispatch(getDataByRoomId(roomId, 'meetings'));

		setData((meetings?.data ?? []) as Meeting[]);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const usersData: any = await dispatch(getData('users'));

		setUsers((usersData?.data ?? []) as User[]);
		setIsLoading(false);
	};

	useEffect(() => {
		fetchAll();
	}, [ roomId ]);

	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<Meeting>[]>(
		() => [
			{ accessorKey: 'id', header: '#' },
			{ accessorKey: 'title', header: titleLabel() },
			{
				accessorKey: 'startsAt',
				header: startsAtLabel(),
				// Postgres bigint serializes as string — coerce before moment() to avoid Invalid Date.
				Cell: ({ cell }) => {
					const v = cell.getValue<number | string>();

					return v ? moment(Number(v)).format('YYYY-MM-DD HH:mm') : '';
				}
			},
			{
				accessorKey: 'rrule',
				header: repeatsLabel(),
				Cell: ({ cell }) => {
					const v = cell.getValue<string | undefined>();
					const parsed = parseRrule(v);

					if (parsed.mode === 'NEVER') return '—';

					return `${parsed.mode} × ${parsed.count}`;
				}
			},
			{
				accessorKey: 'attendees',
				header: attendeesLabel(),
				Cell: ({ row }) => {
					const list = (row.original.attendees ?? []) as MeetingAttendee[];
					const accepted = list.filter((a) => a.partstat === 'ACCEPTED').length;
					const declined = list.filter((a) => a.partstat === 'DECLINED').length;
					const pending = list.filter((a) => !a.partstat || a.partstat === 'NEEDS-ACTION').length;

					return `${accepted} ✓ / ${declined} ✗ / ${pending} ?`;
				}
			}
		],
		[]
	);

	const resetForm = () => {
		setId(0);
		setTitle('');
		setDescription('');
		setStartsAt(moment()
			.add(1, 'hour')
			.startOf('hour'));
		setEndsAt(moment()
			.add(2, 'hour')
			.startOf('hour'));
		setTimezone(browserTimezone());
		setLocale(defaultLocale);
		setRepeatMode('NEVER');
		setRepeatInterval(1);
		setRepeatCount(10);
		setAttendees([]);
		setAttendeeInput(null);
		setResolveEmail('');
		setResolveError(null);
	};

	const handleOpenAdd = () => {
		resetForm();
		setOpen(true);
	};

	const handleOpenEdit = (m: Meeting) => {
		setId(m.id ?? 0);
		setTitle(m.title ?? '');
		setDescription(m.description ?? '');
		setStartsAt(m.startsAt ? moment(Number(m.startsAt)) : null);
		setEndsAt(m.endsAt ? moment(Number(m.endsAt)) : null);
		setTimezone(m.timezone ?? browserTimezone());
		setLocale(m.locale ?? defaultLocale);
		const p = parseRrule(m.rrule);

		setRepeatMode(p.mode);
		setRepeatInterval(p.interval);
		setRepeatCount(p.count);
		setAttendees((m.attendees ?? []) as MeetingAttendee[]);
		setAttendeeInput(null);
		setResolveEmail('');
		setResolveError(null);
		setOpen(true);
	};

	const handleClose = () => setOpen(false);

	const handleResolveAndAdd = () => {
		const email = resolveEmail.trim();

		if (!email) return;
		if (attendees.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
			setResolveError('Already added');

			return;
		}
		setIsResolving(true);
		setResolveError(null);
		dispatch(getUserByEmail(email))
			.then((tdata: unknown) => {
				setIsResolving(false);
				let list: Array<{ id: string | number, email?: string, name?: string }> = [];

				if (Array.isArray(tdata)) {
					list = tdata as Array<{ id: string | number, email?: string, name?: string }>;
				} else if (tdata && typeof tdata === 'object' && 'data' in tdata) {
					const d = (tdata as { data?: unknown }).data;

					if (Array.isArray(d)) list = d as Array<{ id: string | number, email?: string, name?: string }>;
				}
				if (list.length === 0) {
					// not a tenant user — add as external
					setAttendees([ ...attendees, { meetingId: id, email } ]);
					setResolveEmail('');

					return;
				}
				const first = list[0];
				const userId = typeof first.id === 'number' ? first.id : parseInt(String(first.id), 10);

				setAttendees([ ...attendees, {
					meetingId: id,
					email,
					userId,
					name: first.name
				} ]);
				dispatch(persistResolvedUser(userId));
				setResolveEmail('');
			})
			.catch(() => {
				setIsResolving(false);
				setResolveError('Error resolving user');
			});
	};

	const handleAddAttendee = () => {
		if (!attendeeInput) return;
		const email = typeof attendeeInput === 'string' ? attendeeInput.trim() : attendeeInput.email;

		if (!email) return;
		if (attendees.some((a) => a.email.toLowerCase() === email.toLowerCase())) return;
		const newAttendee: MeetingAttendee = {
			meetingId: id,
			email,
			name: typeof attendeeInput === 'string' ? undefined : attendeeInput.name,
			userId: typeof attendeeInput === 'string' ? undefined : attendeeInput.id
		};

		setAttendees([ ...attendees, newAttendee ]);
		setAttendeeInput(null);
	};

	const handleRemoveAttendee = (email: string) => {
		setAttendees(attendees.filter((a) => a.email.toLowerCase() !== email.toLowerCase()));
	};

	const handleSave = async () => {
		if (!title || !startsAt || !endsAt) return;
		const rrule = buildRrule(repeatMode, repeatInterval, repeatCount);
		const recurrenceCount = rrule ? repeatCount : undefined;
		const payload: Partial<Meeting> = {
			title,
			description,
			startsAt: startsAt.valueOf(),
			endsAt: endsAt.valueOf(),
			timezone,
			locale,
			rrule,
			recurrenceCount
		};

		if (id === 0) {
			// create meeting, then add attendees
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const created: any = await dispatch(createData({ ...payload, roomId }, 'meetings'));

			if (created?.id) {
				// Coerce — server returns bigint PKs as strings; attendees service validates meetingId as number.
				const createdMeetingId = Number(created.id);

				await Promise.all(attendees.map((a) => dispatch(createData({
					meetingId: createdMeetingId,
					email: a.email,
					name: a.name,
					userId: a.userId !== undefined ? Number(a.userId) : undefined
				}, 'meetingAttendees'))));
			}
		} else {
			await dispatch(patchData(id, payload, 'meetings'));
			// diff attendees against existing
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const existingRes: any = await dispatch(getData('meetingAttendees', { meetingId: id }));
			const existing: MeetingAttendee[] = (existingRes?.data ?? []) as MeetingAttendee[];
			const byEmail = new Map(existing.map((a) => [ a.email.toLowerCase(), a ]));

			// add new
			for (const a of attendees) {
				if (!byEmail.has(a.email.toLowerCase())) {
					await dispatch(createData({
						meetingId: Number(id),
						email: a.email,
						name: a.name,
						userId: a.userId !== undefined ? Number(a.userId) : undefined
					}, 'meetingAttendees'));
				}
			}
			// remove gone
			const keptEmails = new Set(attendees.map((a) => a.email.toLowerCase()));

			for (const a of existing) {
				if (!keptEmails.has(a.email.toLowerCase()) && a.id) {
					await dispatch(deleteData(a.id, 'meetingAttendees'));
				}
			}
		}
		setOpen(false);
		await fetchAll();
	};

	const handleDelete = async () => {
		// eslint-disable-next-line no-alert
		if (id !== 0 && confirm('Delete this meeting? Attendees will receive a cancellation.')) {
			await dispatch(deleteData(id, 'meetings'));
			setOpen(false);
			await fetchAll();
		}
	};

	return (
		<LocalizationProvider dateAdapter={AdapterMoment} adapterLocale={momentLocale}>
			<Box sx={{ mt: 2 }}>
				<Typography variant="h6">{meetingsLabel()}</Typography>
				<Button variant="outlined" onClick={handleOpenAdd} sx={{ mt: 1, mb: 1 }}>
					{addNewLabel()}
				</Button>
				<MaterialReactTable
					localization={localization}
					columns={columns}
					data={data}
					state={{ isLoading }}
					muiTableBodyRowProps={({ row }) => ({
						onClick: () => handleOpenEdit(row.original)
					})}
				/>
			</Box>
			<Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
				<DialogTitle>{scheduleMeetingLabel()}</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin="dense"
						label={titleLabel()}
						required
						fullWidth
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
					<TextField
						margin="dense"
						label={descLabel()}
						fullWidth
						multiline
						rows={2}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
					<Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
						<DateTimePicker
							label={startsAtLabel()}
							value={startsAt}
							onChange={(v) => setStartsAt(v)}
							ampm={false}
							sx={{ flex: 1 }}
						/>
						<DateTimePicker
							label={endsAtLabel()}
							value={endsAt}
							onChange={(v) => setEndsAt(v)}
							ampm={false}
							sx={{ flex: 1 }}
						/>
					</Box>
					<Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
						<Autocomplete
							sx={{ flex: 1 }}
							options={timezoneOptions}
							value={timezoneOptions.find((o) => o.value === timezone) ?? undefined}
							onChange={(_e, v) => { if (v) setTimezone(v.value); }}
							getOptionLabel={(o) => o.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							disableClearable
							renderInput={(params) => <TextField {...params} label={timezoneLabel()} />}
						/>
						<FormControl sx={{ flex: 1 }}>
							<InputLabel id="meeting-locale-label">{inviteLanguageLabel()}</InputLabel>
							<Select
								labelId="meeting-locale-label"
								label={inviteLanguageLabel()}
								value={locale}
								onChange={(e) => setLocale(e.target.value)}
							>
								{localeList.map(({ file, name }) => (
									<MenuItem key={file} value={file}>{name}</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
					<Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
						<FormControl sx={{ flex: 1 }}>
							<InputLabel id="meeting-repeat-label">{repeatsLabel()}</InputLabel>
							<Select
								labelId="meeting-repeat-label"
								label={repeatsLabel()}
								value={repeatMode}
								onChange={(e) => setRepeatMode(e.target.value as RepeatMode)}
							>
								<MenuItem value="NEVER">{repeatNeverLabel()}</MenuItem>
								<MenuItem value="DAILY">{repeatDailyLabel()}</MenuItem>
								<MenuItem value="WEEKLY">{repeatWeeklyLabel()}</MenuItem>
								<MenuItem value="MONTHLY">{repeatMonthlyLabel()}</MenuItem>
							</Select>
						</FormControl>
						<TextField
							label={repeatIntervalLabel()}
							type="number"
							value={repeatInterval}
							onChange={(e) => setRepeatInterval(parseInt(e.target.value, 10) || 1)}
							disabled={repeatMode === 'NEVER'}
							sx={{ width: 120 }}
						/>
						<TextField
							label={repeatCountLabel()}
							type="number"
							value={repeatCount}
							onChange={(e) => setRepeatCount(parseInt(e.target.value, 10) || 1)}
							disabled={repeatMode === 'NEVER'}
							sx={{ width: 180 }}
						/>
					</Box>
					<Box sx={{ mt: 3 }}>
						<Typography variant="subtitle2" gutterBottom>{attendeesLabel()}</Typography>
						<Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
							<TextField
								label={userEmailLabel()}
								sx={{ flex: 1 }}
								value={resolveEmail}
								onChange={(e) => { setResolveEmail(e.target.value); setResolveError(null); }}
								error={resolveError !== null}
								helperText={resolveError ?? ''}
							/>
							<Button
								variant="outlined"
								onClick={handleResolveAndAdd}
								disabled={isResolving || !resolveEmail.trim()}
							>
								{selectButtonLabel()}
							</Button>
						</Box>
						<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
							<Autocomplete
								sx={{ flex: 1 }}
								options={users}
								getOptionLabel={(o) => `${o.name || o.email} <${o.email}>`}
								value={typeof attendeeInput === 'object' ? attendeeInput : null}
								onChange={(_e, v) => setAttendeeInput(v)}
								renderInput={(params) => <TextField {...params} label={addAttendeeLabel()} />}
							/>
							<Button variant="contained" onClick={handleAddAttendee} disabled={!attendeeInput || typeof attendeeInput === 'string'}>+</Button>
						</Box>
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
							{attendees.map((a) => (
								<Chip
									key={a.email}
									label={`${a.name ?? a.email} — ${partstatLabel(a.partstat)}`}
									color={partstatColor(a.partstat)}
									onDelete={() => handleRemoveAttendee(a.email)}
								/>
							))}
						</Box>
					</Box>
				</DialogContent>
				<DialogActions>
					{id !== 0 && (
						<Button onClick={handleDelete} color="warning">{deleteLabel()}</Button>
					)}
					<Button onClick={handleClose}>{cancelLabel()}</Button>
					<Button onClick={handleSave} disabled={!title || !startsAt || !endsAt}>
						{applyLabel()}
					</Button>
				</DialogActions>
			</Dialog>
		</LocalizationProvider>
	);
};

export default RoomMeetingsTable;

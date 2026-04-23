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
import { Meeting, MeetingAttendee, MeetingOccurrenceRsvp, MeetingPartstat, Room, User } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { localeList } from '../../../utils/intlManager';
import { browserTimezone, timezoneOptions } from '../../../utils/timezones';
import { ensureMomentLocale, toMomentLocale } from '../../../utils/momentLocale';
import {
	createData,
	deleteData,
	getData,
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
	roomLabel,
	scheduleMeetingLabel,
	selectButtonLabel,
	startsAtLabel,
	timezoneLabel,
	titleLabel,
	userEmailLabel
} from '../../translated/translatedComponents';

type RepeatMode = 'NEVER' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

// Maps a UI locale code ("pl", "pl-pl", "en-us", etc.) to a translation file code
// matching localeList entries; falls back to "en" if nothing matches.
// The server-side email template lookup (getTemplate in invites/templates/index.ts)
// falls back to English too when a template isn't present, so any selection is safe.
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

const MeetingsTable = () => {
	const dispatch = useAppDispatch();
	const localization = useMRTLocalization();
	const uiLocale = useAppSelector((state) => state.settings.locale);
	const defaultLocale = mapUiLocaleToFile(uiLocale);
	const momentLocale = toMomentLocale(defaultLocale);

	useEffect(() => { ensureMomentLocale(defaultLocale); }, [ defaultLocale ]);

	const [ data, setData ] = useState<Meeting[]>([]);
	const [ rooms, setRooms ] = useState<Room[]>([]);
	const [ users, setUsers ] = useState<User[]>([]);
	const [ isLoading, setIsLoading ] = useState(false);

	const [ open, setOpen ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ roomId, setRoomId ] = useState<number | ''>('');
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
	const [ occurrenceRsvps, setOccurrenceRsvps ] = useState<MeetingOccurrenceRsvp[]>([]);
	const [ attendeeInput, setAttendeeInput ] = useState<User | string | null>(null);
	const [ resolveEmail, setResolveEmail ] = useState('');
	const [ isResolving, setIsResolving ] = useState(false);
	const [ resolveError, setResolveError ] = useState<string | null>(null);

	const roomName = (rid?: number): string => {
		if (!rid) return '';
		const r = rooms.find((x) => x.id === rid);

		return r?.name ?? String(rid);
	};

	const fetchAll = async () => {
		setIsLoading(true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const meetings: any = await dispatch(getData('meetings'));

		setData((meetings?.data ?? []) as Meeting[]);
		// No ownedOnly: the rooms service's filterByRoomOwnership hook already filters
		// correctly per role (regular users → their owned rooms; tenant admins/owners →
		// all tenant rooms; super-admins → all rooms), matching meeting-create auth.
		// Passing ownedOnly=true would also crash on super-admin since their bypass skips
		// the hook that translates the flag into a proper id filter.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const r: any = await dispatch(getData('rooms'));

		setRooms((r?.data ?? []) as Room[]);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const u: any = await dispatch(getData('users'));

		setUsers((u?.data ?? []) as User[]);
		setIsLoading(false);
	};

	useEffect(() => {
		fetchAll();
	}, []);

	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<Meeting>[]>(
		() => [
			{ accessorKey: 'id', header: '#' },
			{ accessorKey: 'title', header: titleLabel() },
			{
				accessorKey: 'roomId',
				header: roomLabel(),
				Cell: ({ cell }) => roomName(cell.getValue<number>())
			},
			{
				accessorKey: 'startsAt',
				header: startsAtLabel(),
				// Coerce to Number — Postgres bigint columns come back as strings;
				// moment() would parse a numeric string as ISO and yield Invalid Date.
				Cell: ({ cell }) => {
					const v = cell.getValue<number | string>();

					return v ? moment(Number(v)).format('YYYY-MM-DD HH:mm') : '';
				}
			},
			{
				accessorKey: 'endsAt',
				header: endsAtLabel(),
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
					let modeLabel = repeatMonthlyLabel();

					if (parsed.mode === 'DAILY') modeLabel = repeatDailyLabel();
					else if (parsed.mode === 'WEEKLY') modeLabel = repeatWeeklyLabel();

					return `${modeLabel} × ${parsed.count}`;
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
		[ rooms ]
	);

	const resetForm = () => {
		setId(0);
		setRoomId(rooms.length > 0 && rooms[0].id ? Number(rooms[0].id) : '');
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

	const handleOpenEdit = async (m: Meeting) => {
		setId(m.id ?? 0);
		setRoomId(m.roomId);
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
		const list = (m.attendees ?? []) as MeetingAttendee[];

		setAttendees(list);
		setAttendeeInput(null);
		setResolveEmail('');
		setResolveError(null);
		setOpen(true);

		// Fetch per-occurrence exceptions only for recurring meetings that actually have attendees.
		const attendeeIds = list.map((a) => Number(a.id)).filter((n) => !Number.isNaN(n) && n > 0);

		if (m.rrule && attendeeIds.length > 0) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const res: any = await dispatch(getData('meetingOccurrenceRsvps', { meetingAttendeeId: { $in: attendeeIds } }));
			const rows = (res?.data ?? []) as MeetingOccurrenceRsvp[];

			setOccurrenceRsvps(rows);
		} else {
			setOccurrenceRsvps([]);
		}
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
		if (!title || !startsAt || !endsAt || !roomId) return;
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const existingRes: any = await dispatch(getData('meetingAttendees', { meetingId: id }));
			const existing: MeetingAttendee[] = (existingRes?.data ?? []) as MeetingAttendee[];
			const byEmail = new Map(existing.map((a) => [ a.email.toLowerCase(), a ]));

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
			<Box>
				<Typography variant="h6">{meetingsLabel()}</Typography>
				<Button variant="outlined" onClick={handleOpenAdd} sx={{ mt: 1, mb: 1 }} disabled={rooms.length === 0}>
					{addNewLabel()}
				</Button>
				<MaterialReactTable
					localization={localization}
					columns={columns}
					data={data}
					state={{ isLoading }}
					initialState={{ columnVisibility: { id: false } }}
					muiTableBodyRowProps={({ row }) => ({
						onClick: () => handleOpenEdit(row.original)
					})}
				/>
			</Box>
			<Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
				<DialogTitle>{scheduleMeetingLabel()}</DialogTitle>
				<DialogContent>
					<FormControl fullWidth margin="dense" required>
						<InputLabel id="meeting-room-label">{roomLabel()}</InputLabel>
						<Select
							labelId="meeting-room-label"
							label={roomLabel()}
							value={roomId === '' ? '' : String(roomId)}
							onChange={(e) => setRoomId(e.target.value === '' ? '' : Number(e.target.value))}
							disabled={id !== 0}
						>
							{rooms.map((r) => (
								<MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>
							))}
						</Select>
					</FormControl>
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
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
							{attendees.map((a) => {
								const exceptions = a.id
									? occurrenceRsvps
										.filter((r) => Number(r.meetingAttendeeId) === Number(a.id))
										.sort((r1, r2) => Number(r1.recurrenceId) - Number(r2.recurrenceId))
									: [];

								return (
									<Box key={a.email} sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
										<Chip
											label={`${a.name ?? a.email} — ${partstatLabel(a.partstat)}`}
											color={partstatColor(a.partstat)}
											onDelete={() => handleRemoveAttendee(a.email)}
										/>
										{exceptions.map((ex) => (
											<Chip
												key={ex.id}
												size="small"
												variant="outlined"
												label={`${moment(Number(ex.recurrenceId)).format('YYYY-MM-DD')}: ${partstatLabel(ex.partstat)}`}
												color={partstatColor(ex.partstat)}
											/>
										))}
									</Box>
								);
							})}
						</Box>
					</Box>
				</DialogContent>
				<DialogActions>
					{(() => {
						// Coerce both sides to Number — the API may serialize bigint ids as strings,
						// which would break strict equality against the numeric roomId we hold in state.
						const canEdit = roomId !== '' && rooms.some((r) => Number(r.id) === Number(roomId));

						return <>
							{id !== 0 && (
								<Button onClick={handleDelete} color="warning" disabled={!canEdit}>
									{deleteLabel()}
								</Button>
							)}
							<Button onClick={handleClose}>{cancelLabel()}</Button>
							<Button
								onClick={handleSave}
								disabled={!canEdit || !title || !startsAt || !endsAt || !roomId}
							>
								{applyLabel()}
							</Button>
						</>;
					})()}
				</DialogActions>
			</Dialog>
		</LocalizationProvider>
	);
};

export default MeetingsTable;

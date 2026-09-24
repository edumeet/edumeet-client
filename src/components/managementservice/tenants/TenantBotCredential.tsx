import { useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { useMRTLocalization } from '../../../utils/mrtLocalization';
import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	FormLabel,
	IconButton,
	InputAdornment,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { TenantBotCredential } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getDataByTenantID, patchData } from '../../../store/actions/managementActions';
import { generateBotToken, hashBotToken, invalidRanges, parseRangeList, providerFormState } from '../../../utils/botCredentials';
import { TenantProp } from './Tenant';
import { BotJobType, botJobTypes } from '../../../utils/botJobs';
import {
	addNewLabel,
	allowedIpsInvalidLabel,
	allowedIpsLabel,
	allowedIpsTooltipLabel,
	applyLabel,
	botCredentialLabelLabel,
	botTokenCopiedLabel,
	botTokenCopyLabel,
	botTokenGenerateLabel,
	botTokenHashLabel,
	botTokenLabel,
	botTokenShownOnceLabel,
	cancelLabel,
	createdAtLabel,
	deleteLabel,
	enabledLabel,
	lastUsedAtLabel,
	botJobTypeLabel,
	botJobTypeNoneLabel,
	botJobTypeRecorderLabel,
	botJobTypeStreamerLabel,
	botJobTypeTranscriberLabel,
	botApiUrlLabel,
	botApiUrlTooltipLabel,
	botApiSecretLabel,
	botApiSecretKeepLabel,
	botProviderIncompleteLabel,
	manageItemLabel,
	neverLabel,
	noLabel,
	yesLabel,
} from '../../translated/translatedComponents';

// Postgres returns bigint columns as strings, so the value is coerced before it becomes a Date.
const formatTime = (value?: number | string | null): string => (value ? new Date(Number(value)).toLocaleString() : neverLabel());

const jobTypeLabels: Record<BotJobType, () => string> = {
	recorder: botJobTypeRecorderLabel,
	streamer: botJobTypeStreamerLabel,
	transcriber: botJobTypeTranscriberLabel,
};

const TenantBotCredentialTable = (props: TenantProp) => {
	const tenantId = props.tenantId;
	const dispatch = useAppDispatch();
	const localization = useMRTLocalization();

	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<TenantBotCredential>[]>(
		() => [
			{ accessorKey: 'id', header: '#' },
			{ accessorKey: 'label', header: botCredentialLabelLabel() },
			{
				id: 'allowedIps',
				accessorFn: (row) => (row.allowedIps ?? []).join(', '),
				header: allowedIpsLabel(),
			},
			{
				id: 'jobTypes',
				accessorFn: (row) => (row.jobTypes ?? []).map((type) => jobTypeLabels[type]()).join(', '),
				header: botJobTypeLabel(),
			},
			{
				id: 'enabled',
				accessorFn: (row) => (row.enabled ? yesLabel() : noLabel()),
				header: enabledLabel(),
			},
			{
				id: 'createdAt',
				accessorFn: (row) => formatTime(row.createdAt),
				header: createdAtLabel(),
			},
			{
				id: 'lastUsedAt',
				accessorFn: (row) => formatTime(row.lastUsedAt),
				header: lastUsedAtLabel(),
			},
		],
		[],
	);

	const [ data, setData ] = useState<TenantBotCredential[]>([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ open, setOpen ] = useState(false);

	const [ id, setId ] = useState(0);
	const [ label, setLabel ] = useState('');
	const [ rangesText, setRangesText ] = useState('');
	const [ enabled, setEnabled ] = useState(true);
	const [ token, setToken ] = useState('');
	const [ tokenHash, setTokenHash ] = useState('');
	const [ copied, setCopied ] = useState(false);
	const [ jobTypes, setJobTypes ] = useState<BotJobType[]>([]);
	const [ apiUrl, setApiUrl ] = useState('');
	const [ apiSecret, setApiSecret ] = useState('');
	const [ hasApiSecret, setHasApiSecret ] = useState(false);

	async function fetchCredentials() {
		setIsLoading(true);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getDataByTenantID(tenantId, 'tenantBotCredentials')).then((tdata: any) => {
			if (tdata != undefined) setData(tdata.data);
		});
		setIsLoading(false);
	}

	useEffect(() => {
		fetchCredentials();
	}, []);

	const ranges = parseRangeList(rangesText);
	const badRanges = invalidRanges(ranges);
	// A provider is a job type, an https address and a key, all three or none of them.
	const { cleared: providerCleared, incomplete: providerIncomplete } = providerFormState({ jobTypes, apiUrl, apiSecret, hasApiSecret });
	const canApply = label.trim() !== '' && ranges.length > 0 && badRanges.length === 0 && (id !== 0 || tokenHash !== '') && !providerIncomplete;

	const handleClickOpen = () => {
		setId(0);
		setLabel('');
		setRangesText('');
		setEnabled(true);
		setToken('');
		setTokenHash('');
		setCopied(false);
		setJobTypes([]);
		setApiUrl('');
		setApiSecret('');
		setHasApiSecret(false);
		setOpen(true);
	};

	const handleClose = () => setOpen(false);

	const generate = async () => {
		const fresh = generateBotToken();

		setToken(fresh);
		setTokenHash(await hashBotToken(fresh));
		setCopied(false);
	};

	const copy = async () => {
		await navigator.clipboard.writeText(token);
		setCopied(true);
	};

	const remove = async () => {
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			dispatch(deleteData(id, 'tenantBotCredentials')).then(() => {
				fetchCredentials();
				setOpen(false);
			});
		}
	};

	const apply = async () => {
		if (!canApply) return;

		// An empty key keeps the stored one, and an empty address clears the provider.
		const provider = apiUrl.trim() === '' ? { apiUrl: '' } : { jobTypes, apiUrl: apiUrl.trim(), ...(apiSecret ? { apiSecret } : {}) };

		if (id === 0) {
			dispatch(createData({ tenantId, label, tokenHash, allowedIps: ranges, enabled, ...(apiUrl.trim() === '' ? {} : provider) }, 'tenantBotCredentials')).then(() => {
				fetchCredentials();
				setOpen(false);
			});
		} else {
			dispatch(patchData(id, { label, allowedIps: ranges, enabled, ...provider }, 'tenantBotCredentials')).then(() => {
				fetchCredentials();
				setOpen(false);
			});
		}
	};

	return <>
		<div>
			<Button variant="outlined" onClick={() => handleClickOpen()}>
				{addNewLabel()}
			</Button>
			<hr/>
			<Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
				<DialogTitle>{manageItemLabel()}</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{botTokenShownOnceLabel()}
					</DialogContentText>
					<TextField
						margin="dense"
						id="label"
						label={botCredentialLabelLabel()}
						type="text"
						fullWidth
						onChange={(event) => setLabel(event.target.value)}
						value={label}
					/>
					{ id === 0 && <>
						<TextField
							margin="dense"
							id="botToken"
							label={botTokenLabel()}
							type="text"
							fullWidth
							value={token}
							slotProps={{
								input: {
									readOnly: true,
									endAdornment: (
										<InputAdornment position="end">
											<Tooltip title={copied ? botTokenCopiedLabel() : botTokenCopyLabel()}>
												<span>
													<IconButton aria-label={botTokenCopyLabel()} onClick={copy} disabled={!token} edge="end">
														<ContentCopyIcon />
													</IconButton>
												</span>
											</Tooltip>
										</InputAdornment>
									),
								},
							}}
						/>
						<Button variant="outlined" onClick={generate} sx={{ mt: 1, mb: 1 }}>
							{botTokenGenerateLabel()}
						</Button>
						<TextField
							margin="dense"
							id="tokenHash"
							label={botTokenHashLabel()}
							type="text"
							fullWidth
							value={tokenHash}
							slotProps={{ input: { readOnly: true } }}
						/>
					</> }
					<Tooltip title={<Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{allowedIpsTooltipLabel()}</Typography>} placement="top-start">
						<TextField
							margin="dense"
							id="allowedIps"
							label={allowedIpsLabel()}
							multiline
							minRows={3}
							fullWidth
							onChange={(event) => setRangesText(event.target.value)}
							value={rangesText}
							error={badRanges.length > 0}
							helperText={badRanges.length > 0 ? allowedIpsInvalidLabel(badRanges.join(', ')) : ' '}
						/>
					</Tooltip>
					<FormLabel component="legend" sx={{ mt: 1 }}>{botJobTypeLabel()}</FormLabel>
					<FormGroup row id="jobTypes">
						{ botJobTypes.map((type) => (
							<FormControlLabel
								key={type}
								label={jobTypeLabels[type]()}
								control={<Checkbox
									checked={jobTypes.includes(type)}
									onChange={(_, checked) => setJobTypes(botJobTypes.filter((t) => (t === type ? checked : jobTypes.includes(t))))}
								/>}
							/>
						)) }
					</FormGroup>
					{ jobTypes.length === 0 && <FormHelperText>{botJobTypeNoneLabel()}</FormHelperText> }
					{/* It opens over the job types while the address is typed, so it lets clicks through to them. */}
					<Tooltip title={<Typography variant="body2">{botApiUrlTooltipLabel()}</Typography>} placement="top-start" disableInteractive>
						<TextField
							margin="dense"
							id="apiUrl"
							label={botApiUrlLabel()}
							type="url"
							placeholder="https://"
							fullWidth
							onChange={(event) => setApiUrl(event.target.value)}
							value={apiUrl}
						/>
					</Tooltip>
					<TextField
						margin="dense"
						id="apiSecret"
						label={botApiSecretLabel()}
						type="password"
						autoComplete="new-password"
						fullWidth
						onChange={(event) => setApiSecret(event.target.value)}
						value={apiSecret}
						error={providerIncomplete}
						helperText={providerIncomplete ? botProviderIncompleteLabel() : (hasApiSecret && !providerCleared ? botApiSecretKeepLabel() : ' ')}
					/>
					<FormControlLabel
						control={<Checkbox checked={enabled} onChange={(_, checked) => setEnabled(checked)} />}
						label={enabledLabel()}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={remove} color='warning' disabled={id === 0}>{deleteLabel()}</Button>
					<Button onClick={handleClose}>{cancelLabel()}</Button>
					<Button onClick={apply} disabled={!canApply}>{applyLabel()}</Button>
				</DialogActions>
			</Dialog>
		</div>
		<MaterialReactTable localization={localization}
			muiTableBodyRowProps={({ row }) => ({
				onClick: () => {
					const credential = row.original;

					setId(Number(credential.id));
					setLabel(credential.label ?? '');
					setRangesText((credential.allowedIps ?? []).join('\n'));
					setEnabled(Boolean(credential.enabled));
					setToken('');
					setTokenHash('');
					setCopied(false);
					setJobTypes(botJobTypes.filter((type) => (credential.jobTypes ?? []).includes(type)));
					setApiUrl(credential.apiUrl ?? '');
					setApiSecret('');
					setHasApiSecret(Boolean(credential.hasApiSecret));
					setOpen(true);
				}
			})}
			columns={columns}
			data={data}
			initialState={{ columnVisibility: { id: false } }}
			state={{ isLoading }} /></>;
};

export default TenantBotCredentialTable;

import { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	TextField,
	Typography
} from '@mui/material';
import { TenantInviteConfig } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, getData, patchData, testInviteConfig } from '../../../store/actions/managementActions';

interface TestResultSide { ok: boolean; error?: string }
interface TestResult { smtp: TestResultSide; imap?: TestResultSide }
import {
	applyLabel,
	cancelLabel,
	imapHostLabel,
	imapOptionalNoteLabel,
	imapPasswordLabel,
	imapPortLabel,
	imapSecureLabel,
	imapUserLabel,
	inviteEmailConfigLabel,
	inviteEnabledLabel,
	manageItemLabel,
	organizerAddressLabel,
	organizerNameLabel,
	passwordUnchangedLabel,
	smtpHostLabel,
	smtpPasswordLabel,
	smtpPortLabel,
	smtpSecureLabel,
	smtpUserLabel,
	testConnectionLabel
} from '../../translated/translatedComponents';

export interface TenantInviteConfigProps {
	tenantId: number;
}

// When the secure toggle flips, auto-switch the port if it's still at one of
// the standard defaults (so admins don't have to remember 465 vs 587, 993 vs 143).
// Custom port values are preserved.
const swapPortIfDefault = (currentPort: number, nowSecure: boolean, implicitPort: number, startTlsPort: number): number => {
	if (nowSecure && currentPort === startTlsPort) return implicitPort;
	if (!nowSecure && currentPort === implicitPort) return startTlsPort;

	return currentPort;
};

const TenantInviteConfigPanel = (props: TenantInviteConfigProps) => {
	const { tenantId } = props;
	const dispatch = useAppDispatch();

	const [ open, setOpen ] = useState(false);
	const [ existingId, setExistingId ] = useState<number | null>(null);
	const [ enabled, setEnabled ] = useState(true);
	const [ organizerAddress, setOrganizerAddress ] = useState('');
	const [ organizerName, setOrganizerName ] = useState('');
	const [ smtpHost, setSmtpHost ] = useState('');
	// Default to implicit TLS (port 465, secure=true) — most modern/recommended setup.
	const [ smtpPort, setSmtpPort ] = useState(465);
	const [ smtpSecure, setSmtpSecure ] = useState(true);
	const [ smtpUser, setSmtpUser ] = useState('');
	const [ smtpPass, setSmtpPass ] = useState('');
	const [ imapHost, setImapHost ] = useState('');
	const [ imapPort, setImapPort ] = useState(993);
	const [ imapSecure, setImapSecure ] = useState(true);
	const [ imapUser, setImapUser ] = useState('');
	const [ imapPass, setImapPass ] = useState('');
	const [ testing, setTesting ] = useState(false);
	const [ testResult, setTestResult ] = useState<TestResult | null>(null);

	const fetchConfig = async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res: any = await dispatch(getData('tenantInviteConfigs', { tenantId }));
		const list = (res?.data ?? []) as TenantInviteConfig[];
		const cfg = list[0];

		if (cfg && cfg.id !== undefined) {
			setExistingId(cfg.id);
			setEnabled(cfg.enabled);
			setOrganizerAddress(cfg.organizerAddress ?? '');
			setOrganizerName(cfg.organizerName ?? '');
			setSmtpHost(cfg.smtpHost ?? '');
			setSmtpPort(cfg.smtpPort ?? 465);
			setSmtpSecure(cfg.smtpSecure ?? true);
			setSmtpUser(cfg.smtpUser ?? '');
			setSmtpPass(''); // never pre-fill password
			setImapHost(cfg.imapHost ?? '');
			setImapPort(cfg.imapPort ?? 993);
			setImapSecure(cfg.imapSecure ?? true);
			setImapUser(cfg.imapUser ?? '');
			setImapPass('');
		} else {
			setExistingId(null);
		}
	};

	useEffect(() => {
		fetchConfig();
	}, [ tenantId ]);

	const handleOpen = () => {
		// refresh values when opening the sub-dialog in case the config changed elsewhere
		fetchConfig();
		setTestResult(null);
		setOpen(true);
	};

	const handleClose = () => {
		setTestResult(null);
		setOpen(false);
	};

	const handleTestConnection = async () => {
		setTesting(true);
		setTestResult(null);
		try {
			const res = await dispatch(testInviteConfig(tenantId));

			setTestResult(res);
		} catch (err) {
			setTestResult({ smtp: { ok: false, error: (err as Error)?.message ?? String(err) } });
		} finally {
			setTesting(false);
		}
	};

	const handleSave = async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const payload: any = {
			enabled,
			organizerAddress,
			organizerName: organizerName || undefined,
			smtpHost,
			smtpPort,
			smtpSecure,
			smtpUser,
			imapHost: imapHost || undefined,
			imapPort: imapHost ? imapPort : undefined,
			imapSecure: imapHost ? imapSecure : undefined,
			imapUser: imapHost ? imapUser : undefined
		};

		// only include passwords if the user typed something
		if (smtpPass) payload.smtpPass = smtpPass;
		if (imapPass) payload.imapPass = imapPass;

		if (existingId === null) {
			// new config requires smtpPass — guard
			if (!smtpPass) {
				// eslint-disable-next-line no-alert
				alert('SMTP password is required for initial setup.');

				return;
			}
			payload.tenantId = tenantId;
			await dispatch(createData(payload, 'tenantInviteConfigs'));
		} else {
			await dispatch(patchData(existingId, payload, 'tenantInviteConfigs'));
		}
		await fetchConfig();
		setOpen(false);
	};

	const statusText = existingId
		? `${organizerAddress || ''}${enabled ? '' : ' (disabled)'}`
		: '—';

	return (
		<Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
			<Button variant="outlined" onClick={handleOpen}>
				{manageItemLabel()}
			</Button>
			<Typography variant="body2" color="text.secondary">
				{statusText}
			</Typography>

			<Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
				<DialogTitle>{inviteEmailConfigLabel()}</DialogTitle>
				<DialogContent>
					<FormControlLabel
						control={<Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
						label={inviteEnabledLabel()}
					/>
					<Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
						<TextField
							label={organizerAddressLabel()}
							required
							sx={{ flex: '1 1 240px' }}
							type="email"
							value={organizerAddress}
							onChange={(e) => setOrganizerAddress(e.target.value)}
						/>
						<TextField
							label={organizerNameLabel()}
							sx={{ flex: '1 1 240px' }}
							value={organizerName}
							onChange={(e) => setOrganizerName(e.target.value)}
						/>
					</Box>

					<Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>SMTP</Typography>
					<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
						<TextField
							label={smtpHostLabel()}
							required
							sx={{ flex: '3 1 240px' }}
							value={smtpHost}
							onChange={(e) => setSmtpHost(e.target.value)}
							placeholder="smtp.example.com"
							error={smtpHost.includes('@')}
							helperText={smtpHost.includes('@') ? 'Server hostname only (no @)' : ''}
						/>
						<TextField
							label={smtpPortLabel()}
							required
							type="number"
							sx={{ flex: '1 1 120px', minWidth: 120 }}
							value={smtpPort}
							onChange={(e) => setSmtpPort(parseInt(e.target.value, 10) || 465)}
						/>
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
							<FormControlLabel
								control={<Checkbox checked={smtpSecure} onChange={(e) => {
									const next = e.target.checked;

									setSmtpSecure(next);
									setSmtpPort(swapPortIfDefault(smtpPort, next, 465, 587));
								}} />}
								label={smtpSecureLabel()}
								sx={{ mr: 0 }}
							/>
							<Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -0.5 }}>
								{smtpSecure ? 'SSL (implicit TLS)' : 'STARTTLS'}
							</Typography>
						</Box>
					</Box>
					<Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
						<TextField
							label={smtpUserLabel()}
							required
							sx={{ flex: '1 1 240px' }}
							value={smtpUser}
							onChange={(e) => setSmtpUser(e.target.value)}
						/>
						<TextField
							label={smtpPasswordLabel()}
							type="password"
							required={!existingId}
							sx={{ flex: '1 1 240px' }}
							value={smtpPass}
							onChange={(e) => setSmtpPass(e.target.value)}
							placeholder={existingId ? passwordUnchangedLabel() : ''}
							InputLabelProps={existingId ? { shrink: true } : undefined}
						/>
					</Box>

					<Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>IMAP</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
						{imapOptionalNoteLabel()}
					</Typography>
					<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
						<TextField
							label={imapHostLabel()}
							sx={{ flex: '3 1 240px' }}
							value={imapHost}
							onChange={(e) => setImapHost(e.target.value)}
							placeholder="imap.example.com"
							error={imapHost.includes('@')}
							helperText={imapHost.includes('@') ? 'Server hostname only (no @)' : ''}
						/>
						<TextField
							label={imapPortLabel()}
							type="number"
							required={Boolean(imapHost)}
							sx={{ flex: '1 1 120px', minWidth: 120 }}
							value={imapPort}
							onChange={(e) => setImapPort(parseInt(e.target.value, 10) || 993)}
							disabled={!imapHost}
						/>
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
							<FormControlLabel
								control={<Checkbox checked={imapSecure} onChange={(e) => {
									const next = e.target.checked;

									setImapSecure(next);
									setImapPort(swapPortIfDefault(imapPort, next, 993, 143));
								}} disabled={!imapHost} />}
								label={imapSecureLabel()}
								sx={{ mr: 0 }}
							/>
							<Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -0.5 }}>
								{imapSecure ? 'SSL (implicit TLS)' : 'STARTTLS'}
							</Typography>
						</Box>
					</Box>
					<Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
						<TextField
							label={imapUserLabel()}
							required={Boolean(imapHost)}
							sx={{ flex: '1 1 240px' }}
							value={imapUser}
							onChange={(e) => setImapUser(e.target.value)}
							disabled={!imapHost}
						/>
						<TextField
							label={imapPasswordLabel()}
							type="password"
							required={Boolean(imapHost) && !existingId}
							sx={{ flex: '1 1 240px' }}
							value={imapPass}
							onChange={(e) => setImapPass(e.target.value)}
							placeholder={existingId ? passwordUnchangedLabel() : ''}
							InputLabelProps={existingId ? { shrink: true } : undefined}
							disabled={!imapHost}
						/>
					</Box>
				</DialogContent>
				{testResult && (
					<Box sx={{ mx: 3, mb: 1 }}>
						<Typography variant="body2" color={testResult.smtp.ok ? 'success.main' : 'error'}>
							SMTP: {testResult.smtp.ok ? '✓ OK' : `✗ ${testResult.smtp.error ?? 'failed'}`}
						</Typography>
						{testResult.imap && (
							<Typography variant="body2" color={testResult.imap.ok ? 'success.main' : 'error'}>
								IMAP: {testResult.imap.ok ? '✓ OK' : `✗ ${testResult.imap.error ?? 'failed'}`}
							</Typography>
						)}
					</Box>
				)}
				<DialogActions>
					<Button
						onClick={handleTestConnection}
						disabled={testing || existingId === null}
					>
						{testConnectionLabel()}
					</Button>
					<Box sx={{ flex: 1 }} />
					<Button onClick={handleClose}>{cancelLabel()}</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={!organizerAddress || !smtpHost || !smtpUser}
					>
						{applyLabel()}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default TenantInviteConfigPanel;

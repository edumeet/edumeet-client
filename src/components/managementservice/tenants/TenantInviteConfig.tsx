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
import { createData, getData, patchData } from '../../../store/actions/managementActions';
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
	organizerAddressLabel,
	organizerNameLabel,
	passwordUnchangedLabel,
	smtpHostLabel,
	smtpPasswordLabel,
	smtpPortLabel,
	smtpSecureLabel,
	smtpUserLabel
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
	const [ smtpPort, setSmtpPort ] = useState(587);
	const [ smtpSecure, setSmtpSecure ] = useState(false);
	const [ smtpUser, setSmtpUser ] = useState('');
	const [ smtpPass, setSmtpPass ] = useState('');
	const [ imapHost, setImapHost ] = useState('');
	const [ imapPort, setImapPort ] = useState(993);
	const [ imapSecure, setImapSecure ] = useState(true);
	const [ imapUser, setImapUser ] = useState('');
	const [ imapPass, setImapPass ] = useState('');

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
			setSmtpPort(cfg.smtpPort ?? 587);
			setSmtpSecure(cfg.smtpSecure ?? false);
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
		setOpen(true);
	};

	const handleClose = () => setOpen(false);

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
		<Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
			<Button variant="outlined" onClick={handleOpen}>
				{inviteEmailConfigLabel()}
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
					<Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
						<TextField
							label={organizerAddressLabel()}
							required
							fullWidth
							type="email"
							value={organizerAddress}
							onChange={(e) => setOrganizerAddress(e.target.value)}
						/>
						<TextField
							label={organizerNameLabel()}
							fullWidth
							value={organizerName}
							onChange={(e) => setOrganizerName(e.target.value)}
						/>
					</Box>

					<Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>SMTP</Typography>
					<Box sx={{ display: 'flex', gap: 2 }}>
						<TextField
							label={smtpHostLabel()}
							required
							sx={{ flex: 3 }}
							value={smtpHost}
							onChange={(e) => setSmtpHost(e.target.value)}
						/>
						<TextField
							label={smtpPortLabel()}
							required
							type="number"
							sx={{ flex: 1, minWidth: 120 }}
							value={smtpPort}
							onChange={(e) => setSmtpPort(parseInt(e.target.value, 10) || 587)}
						/>
						<FormControlLabel
							control={<Checkbox checked={smtpSecure} onChange={(e) => {
								const next = e.target.checked;

								setSmtpSecure(next);
								setSmtpPort(swapPortIfDefault(smtpPort, next, 465, 587));
							}} />}
							label={smtpSecureLabel()}
						/>
					</Box>
					<Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
						<TextField
							label={smtpUserLabel()}
							required
							fullWidth
							value={smtpUser}
							onChange={(e) => setSmtpUser(e.target.value)}
						/>
						<TextField
							label={smtpPasswordLabel()}
							type="password"
							required={!existingId}
							fullWidth
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
					<Box sx={{ display: 'flex', gap: 2 }}>
						<TextField
							label={imapHostLabel()}
							sx={{ flex: 3 }}
							value={imapHost}
							onChange={(e) => setImapHost(e.target.value)}
						/>
						<TextField
							label={imapPortLabel()}
							type="number"
							required={Boolean(imapHost)}
							sx={{ flex: 1, minWidth: 120 }}
							value={imapPort}
							onChange={(e) => setImapPort(parseInt(e.target.value, 10) || 993)}
							disabled={!imapHost}
						/>
						<FormControlLabel
							control={<Checkbox checked={imapSecure} onChange={(e) => {
								const next = e.target.checked;

								setImapSecure(next);
								setImapPort(swapPortIfDefault(imapPort, next, 993, 143));
							}} disabled={!imapHost} />}
							label={imapSecureLabel()}
						/>
					</Box>
					<Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
						<TextField
							label={imapUserLabel()}
							required={Boolean(imapHost)}
							fullWidth
							value={imapUser}
							onChange={(e) => setImapUser(e.target.value)}
							disabled={!imapHost}
						/>
						<TextField
							label={imapPasswordLabel()}
							type="password"
							required={Boolean(imapHost) && !existingId}
							fullWidth
							value={imapPass}
							onChange={(e) => setImapPass(e.target.value)}
							placeholder={existingId ? passwordUnchangedLabel() : ''}
							InputLabelProps={existingId ? { shrink: true } : undefined}
							disabled={!imapHost}
						/>
					</Box>
				</DialogContent>
				<DialogActions>
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Divider,
	FormControlLabel,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Stack,
	Typography,
	styled,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAppDispatch, useAppSelector, usePermissionSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { permissions as allClientPermissions } from '../../utils/roles';
import {
	applyPermissionsLabel,
	closeLabel,
	discardChangesLabel,
	managePermissionsLabel,
	noLabel,
	noOtherPeersLabel,
	pendingChangesLabel,
	permissionDescriptions,
	permissionsLabel,
	resetDraftLabel,
	selectAllLabel,
	selectPeersFirstLabel,
	yesLabel,
} from '../translated/translatedComponents';
import GenericDialog from '../genericdialog/GenericDialog';
import {
	fetchRoomPermissions,
	PermissionsPeer,
	setRoomPermissions,
	PermissionUpdate,
} from '../../store/actions/moderatorPermissionsActions';

const SplitContent = styled(Box)(({ theme }) => ({
	display: 'flex',
	gap: theme.spacing(2),
	minHeight: 400,
}));

const PeerColumn = styled(Box)(({ theme }) => ({
	flex: '0 0 260px',
	borderRight: `1px solid ${theme.palette.divider}`,
	paddingRight: theme.spacing(1),
	overflowY: 'auto',
	maxHeight: 480,
}));

const PermissionColumn = styled(Box)({
	flex: 1,
	overflowY: 'auto',
	maxHeight: 480,
});

const PermissionRow = styled(ListItem)(({ theme }) => ({
	alignItems: 'flex-start',
	paddingLeft: 0,
	paddingRight: 0,
	borderBottom: `1px solid ${theme.palette.divider}`,
}));

const PermissionKey = styled(Typography)({
	fontFamily: 'monospace',
	fontWeight: 600,
});

const PendingStrip = styled(Box)(({ theme }) => ({
	marginTop: theme.spacing(2),
	paddingTop: theme.spacing(1),
	borderTop: `1px solid ${theme.palette.divider}`,
	maxHeight: 160,
	overflowY: 'auto',
}));

interface PeerDiff {
	peerId: string;
	displayName?: string;
	added: string[];
	removed: string[];
}

const setsEqual = (a: Set<string>, b: Set<string>): boolean => {
	if (a.size !== b.size) return false;
	for (const v of a) if (!b.has(v)) return false;

	return true;
};

const PermissionsDialog = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const open = useAppSelector((state) => state.ui.permissionsDialogOpen);
	const isModerator = usePermissionSelector(allClientPermissions.MODERATE_ROOM);
	const callerPermissions = useAppSelector((state) => state.permissions.permissions);

	const [ peers, setPeers ] = useState<PermissionsPeer[] | null>(null);
	const [ selectedPeerIds, setSelectedPeerIds ] = useState<Set<string>>(new Set());
	// Shared draft set. Auto-seeded from the union of selected peers while clean.
	// Once the user toggles anything, draftDirty locks it so selection changes
	// never overwrite the user's in-progress edits.
	const [ draft, setDraft ] = useState<Set<string>>(new Set());
	const [ draftDirty, setDraftDirty ] = useState(false);
	const [ loading, setLoading ] = useState(false);
	const [ submitting, setSubmitting ] = useState(false);
	const [ confirmCloseOpen, setConfirmCloseOpen ] = useState(false);

	const permissionKeys = useMemo(() => Object.values(allClientPermissions), []);
	const callerPermissionSet = useMemo(() => new Set(callerPermissions), [ callerPermissions ]);

	const reload = useCallback(async () => {
		setLoading(true);
		try {
			const result = await dispatch(fetchRoomPermissions());

			setPeers(result);
			setDraft(new Set());
			setDraftDirty(false);
			setSelectedPeerIds((prev) => {
				const valid = new Set<string>();
				const ids = new Set(result.map((p) => p.id));

				prev.forEach((id) => ids.has(id) && valid.add(id));

				return valid;
			});
		} finally {
			setLoading(false);
		}
	}, [ dispatch ]);

	useEffect(() => {
		if (!open) return;

		reload();
	}, [ open, reload ]);

	// Compute the union of permissions for a given set of peer ids. Used to seed
	// the draft when it is still clean.
	const computeUnion = useCallback((ids: Set<string>): Set<string> => {
		const union = new Set<string>();

		if (!peers) return union;
		ids.forEach((id) => {
			peers.find((p) => p.id === id)?.permissions.forEach((p) => union.add(p));
		});

		return union;
	}, [ peers ]);

	const doClose = (): void => {
		setConfirmCloseOpen(false);
		dispatch(uiActions.setUi({ permissionsDialogOpen: false }));
		setPeers(null);
		setDraft(new Set());
		setDraftDirty(false);
		setSelectedPeerIds(new Set());
	};

	const handleClose = (): void => {
		if (draftDirty && !submitting) {
			setConfirmCloseOpen(true);

			return;
		}

		doClose();
	};

	const togglePeer = (peerId: string): void => {
		const next = new Set(selectedPeerIds);

		if (next.has(peerId)) next.delete(peerId);
		else next.add(peerId);

		setSelectedPeerIds(next);
		if (!draftDirty) setDraft(computeUnion(next));
	};

	const toggleSelectAll = (): void => {
		if (!peers) return;

		const next = selectedPeerIds.size === peers.length
			? new Set<string>()
			: new Set(peers.map((p) => p.id));

		setSelectedPeerIds(next);
		if (!draftDirty) setDraft(computeUnion(next));
	};

	const isPermissionChecked = (perm: string): boolean => draft.has(perm);

	const togglePermission = (perm: string): void => {
		if (selectedPeerIds.size === 0) return;

		setDraftDirty(true);
		setDraft((prev) => {
			const next = new Set(prev);

			if (next.has(perm)) next.delete(perm);
			else next.add(perm);

			return next;
		});
	};

	const peerDiffs = useMemo<PeerDiff[]>(() => {
		if (!peers) return [];

		const diffs: PeerDiff[] = [];

		for (const peer of peers) {
			if (!selectedPeerIds.has(peer.id)) continue;

			const original = new Set(peer.permissions);

			if (setsEqual(original, draft)) continue;

			const added: string[] = [];
			const removed: string[] = [];

			draft.forEach((p) => { if (!original.has(p)) added.push(p); });
			original.forEach((p) => { if (!draft.has(p)) removed.push(p); });

			diffs.push({ peerId: peer.id, displayName: peer.displayName, added, removed });
		}

		return diffs;
	}, [ peers, selectedPeerIds, draft ]);

	const changedUpdates = useMemo<PermissionUpdate[]>(
		() => peerDiffs.map((d) => ({ peerId: d.peerId, permissions: [ ...draft ] })),
		[ peerDiffs, draft ],
	);

	const handleReset = (): void => {
		setDraftDirty(false);
		setDraft(computeUnion(selectedPeerIds));
	};

	const handleSubmit = async (): Promise<void> => {
		if (changedUpdates.length === 0) return;

		setSubmitting(true);
		try {
			await dispatch(setRoomPermissions(changedUpdates));
			await reload();
		} finally {
			setSubmitting(false);
		}
	};

	if (!isModerator) {
		return <></>;
	}

	const allSelected = peers !== null && peers.length > 0 && selectedPeerIds.size === peers.length;

	return (
		<>
			<GenericDialog
				open={open}
				onClose={handleClose}
				maxWidth='lg'
				title={managePermissionsLabel()}
				content={
					<>
						<SplitContent>
							<PeerColumn>
								<Typography variant='subtitle2' sx={{ mb: 1 }}>
									{permissionsLabel()}
								</Typography>
								{loading && !peers ? (
									<Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
										<CircularProgress size={24} />
									</Box>
								) : peers && peers.length > 0 ? (
									<>
										<FormControlLabel
											control={
												<Checkbox
													checked={allSelected}
													indeterminate={!allSelected && selectedPeerIds.size > 0}
													onChange={toggleSelectAll}
												/>
											}
											label={selectAllLabel()}
										/>
										<Divider />
										<List dense disablePadding>
											{peers.map((peer) => (
												<ListItemButton
													key={peer.id}
													onClick={() => togglePeer(peer.id)}
													dense
												>
													<ListItemIcon sx={{ minWidth: 36 }}>
														<Checkbox
															edge='start'
															checked={selectedPeerIds.has(peer.id)}
															tabIndex={-1}
															disableRipple
														/>
													</ListItemIcon>
													<ListItemText primary={peer.displayName || peer.id} />
												</ListItemButton>
											))}
										</List>
									</>
								) : (
									<Typography variant='body2' color='text.secondary'>
										{noOtherPeersLabel()}
									</Typography>
								)}
							</PeerColumn>
							<PermissionColumn>
								{selectedPeerIds.size === 0 && (
									<Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
										{selectPeersFirstLabel()}
									</Typography>
								)}
								<List dense disablePadding>
									{permissionKeys.map((perm) => {
										const callerLacks = !callerPermissionSet.has(perm);
										const disabled = callerLacks || selectedPeerIds.size === 0 || submitting;
										const description = permissionDescriptions[perm]?.();
										const checked = isPermissionChecked(perm);

										return (
											<PermissionRow key={perm} disablePadding>
												<ListItemIcon sx={{ minWidth: 36, mt: 1 }}>
													<Checkbox
														edge='start'
														checked={checked}
														disabled={disabled}
														onChange={() => togglePermission(perm)}
													/>
												</ListItemIcon>
												<Stack sx={{ py: 1, pr: 1, flex: 1 }}>
													<PermissionKey variant='body2'>{perm}</PermissionKey>
													{description && (
														<Typography variant='caption' color='text.secondary'>
															{description}
														</Typography>
													)}
												</Stack>
											</PermissionRow>
										);
									})}
								</List>
							</PermissionColumn>
						</SplitContent>
						{peerDiffs.length > 0 && (
							<PendingStrip>
								<Typography variant='subtitle2' sx={{ mb: 1 }}>
									{pendingChangesLabel()} ({peerDiffs.length})
								</Typography>
								<Stack spacing={0.5}>
									{peerDiffs.map((diff) => {
										const peer = peers?.find((p) => p.id === diff.peerId);

										return (
											<Stack
												key={diff.peerId}
												direction='row'
												spacing={0.5}
												flexWrap='wrap'
												alignItems='center'
											>
												<Typography variant='body2' sx={{ fontWeight: 600, minWidth: 120 }}>
													{peer?.displayName || diff.peerId}:
												</Typography>
												{diff.added.map((p) => (
													<Chip
														key={`+${p}`}
														label={`+ ${p}`}
														size='small'
														color='success'
														variant='outlined'
													/>
												))}
												{diff.removed.map((p) => (
													<Chip
														key={`-${p}`}
														label={`− ${p}`}
														size='small'
														color='error'
														variant='outlined'
													/>
												))}
											</Stack>
										);
									})}
								</Stack>
							</PendingStrip>
						)}
					</>
				}
				actions={
					<>
						<Button
							onClick={handleClose}
							startIcon={<CloseIcon />}
							variant='outlined'
							size='small'
							disabled={submitting}
							sx={{ marginRight: 'auto' }}
						>
							{closeLabel()}
						</Button>
						<Button
							onClick={handleReset}
							variant='contained'
							size='small'
							disabled={!draftDirty || submitting}
						>
							{resetDraftLabel()}
						</Button>
						<Button
							onClick={handleSubmit}
							variant='contained'
							color='error'
							size='small'
							disabled={changedUpdates.length === 0 || submitting || loading}
						>
							{submitting ? <CircularProgress size={18} /> : applyPermissionsLabel(changedUpdates.length)}
						</Button>
					</>
				}
			/>
			<GenericDialog
				open={confirmCloseOpen}
				onClose={() => setConfirmCloseOpen(false)}
				maxWidth='xs'
				title={discardChangesLabel()}
				actions={
					<>
						<Button onClick={() => setConfirmCloseOpen(false)}>
							{noLabel()}
						</Button>
						<Button
							onClick={doClose}
							color='error'
							variant='contained'
						>
							{yesLabel()}
						</Button>
					</>
				}
			/>
		</>
	);
};

export default PermissionsDialog;

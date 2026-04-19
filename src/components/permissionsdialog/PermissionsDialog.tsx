import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Box,
	Button,
	Checkbox,
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
	managePermissionsLabel,
	noOtherPeersLabel,
	permissionDescriptions,
	permissionsLabel,
	selectAllLabel,
	selectPeersFirstLabel,
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

const PermissionsDialog = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const open = useAppSelector((state) => state.ui.permissionsDialogOpen);
	const isModerator = usePermissionSelector(allClientPermissions.MODERATE_ROOM);
	const callerPermissions = useAppSelector((state) => state.permissions.permissions);

	const [ peers, setPeers ] = useState<PermissionsPeer[] | null>(null);
	const [ selectedPeerIds, setSelectedPeerIds ] = useState<Set<string>>(new Set());
	const [ draft, setDraft ] = useState<Record<string, Set<string>>>({});
	const [ loading, setLoading ] = useState(false);
	const [ submitting, setSubmitting ] = useState(false);

	const permissionKeys = useMemo(() => Object.values(allClientPermissions), []);
	const callerPermissionSet = useMemo(() => new Set(callerPermissions), [ callerPermissions ]);

	const reload = useCallback(async () => {
		setLoading(true);
		try {
			const result = await dispatch(fetchRoomPermissions());

			setPeers(result);
			setDraft(Object.fromEntries(result.map((p) => [ p.id, new Set(p.permissions) ])));
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

	const handleClose = (): void => {
		dispatch(uiActions.setUi({ permissionsDialogOpen: false }));
		setPeers(null);
		setDraft({});
		setSelectedPeerIds(new Set());
	};

	const togglePeer = (peerId: string): void => {
		setSelectedPeerIds((prev) => {
			const next = new Set(prev);

			if (next.has(peerId)) next.delete(peerId);
			else next.add(peerId);

			return next;
		});
	};

	const toggleSelectAll = (): void => {
		if (!peers) return;

		setSelectedPeerIds((prev) => {
			if (prev.size === peers.length) return new Set();

			return new Set(peers.map((p) => p.id));
		});
	};

	const permissionStateForSelected = (perm: string): 'all' | 'none' | 'mixed' => {
		if (selectedPeerIds.size === 0) return 'none';

		let has = 0;

		selectedPeerIds.forEach((id) => {
			if (draft[id]?.has(perm)) has++;
		});

		if (has === 0) return 'none';
		if (has === selectedPeerIds.size) return 'all';

		return 'mixed';
	};

	const togglePermissionForSelected = (perm: string): void => {
		if (selectedPeerIds.size === 0) return;

		const state = permissionStateForSelected(perm);
		const shouldGrant = state !== 'all';

		setDraft((prev) => {
			const next: Record<string, Set<string>> = { ...prev };

			selectedPeerIds.forEach((id) => {
				const current = next[id] ? new Set(next[id]) : new Set<string>();

				if (shouldGrant) current.add(perm);
				else current.delete(perm);

				next[id] = current;
			});

			return next;
		});
	};

	const changedUpdates = useMemo<PermissionUpdate[]>(() => {
		if (!peers) return [];

		const updates: PermissionUpdate[] = [];

		for (const peer of peers) {
			const original = new Set(peer.permissions);
			const draftSet = draft[peer.id] ?? new Set<string>();

			if (
				original.size !== draftSet.size ||
				[ ...original ].some((p) => !draftSet.has(p))
			) {
				updates.push({ peerId: peer.id, permissions: [ ...draftSet ] });
			}
		}

		return updates;
	}, [ peers, draft ]);

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
		<GenericDialog
			open={open}
			onClose={handleClose}
			maxWidth='lg'
			title={managePermissionsLabel()}
			content={
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
								const state = permissionStateForSelected(perm);
								const callerLacks = !callerPermissionSet.has(perm);
								const disabled = callerLacks || selectedPeerIds.size === 0 || submitting;
								const description = permissionDescriptions[perm]?.();

								return (
									<PermissionRow key={perm} disablePadding>
										<ListItemIcon sx={{ minWidth: 36, mt: 1 }}>
											<Checkbox
												edge='start'
												checked={state === 'all'}
												indeterminate={state === 'mixed'}
												disabled={disabled}
												onChange={() => togglePermissionForSelected(perm)}
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
			}
			actions={
				<>
					<Button
						onClick={handleClose}
						startIcon={<CloseIcon />}
						variant='outlined'
						size='small'
						disabled={submitting}
					>
						{closeLabel()}
					</Button>
					<Button
						onClick={handleSubmit}
						variant='contained'
						size='small'
						disabled={changedUpdates.length === 0 || submitting || loading}
					>
						{submitting ? <CircularProgress size={18} /> : applyPermissionsLabel(changedUpdates.length)}
					</Button>
				</>
			}
		/>
	);
};

export default PermissionsDialog;

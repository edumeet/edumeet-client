/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import Autocomplete from '@mui/material/Autocomplete';
import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Grid2 as Grid, Checkbox, InputAdornment } from '@mui/material';
import React from 'react';
import { Groups, Roles, Tenant, TenantOptionTypes, RoleOptionTypes, DefaultOptionTypes, Default } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import { notificationsActions } from '../../../store/slices/notificationsSlice';
import { addNewLabel, applyLabel, cancelLabel, deleteLabel, genericItemDescLabel, manageItemLabel, tenantLabel } from '../../translated/translatedComponents';
import { managamentActions } from '../../../store/slices/managementSlice';
import { getTenantName } from '../../../utils/management';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import BlockIcon from '@mui/icons-material/Block';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';

const DefaultTable = () => {
	const dispatch = useAppDispatch();
	const tenants: TenantOptionTypes = useAppSelector((state) => state.management.tenants);
	const roles: RoleOptionTypes = useAppSelector((state) => state.management.roles);

	const { superAdmin } = useAppSelector((state) => state.management);

	// should be memoized or stable
	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<Default>[]>(
		() => [

			{
				accessorKey: 'id',
				header: '#'
			},
			{
				accessorKey: 'tenantId',
				header: tenantLabel(),
				Cell: ({ cell }) => getTenantName(tenants, cell.getValue<string>())
			}
		],
		[ tenants ],
	);

	const [ data, setData ] = useState<DefaultOptionTypes>([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);

	const [ numberLimit, setNumberLimit ] = useState(0);
	const [ liveNumberLimit, setLiveNumberLimit ] = useState(0);
	const [ userManagedRoomNumberLimit, setUserManagedRoomNumberLimit ] = useState(0);
	const [ managerManagedRoomNumberLimit, setManagerManagedRoomNumberLimit ] = useState(0);
	const [ lockedManaged, setLockManaged ] = useState(false);
	const [ raiseHandEnabledManaged, setRaiseHandEnabledManaged ] = useState(false);
	const [ localRecordingEnabledManaged, setLocalRecordingEnabledManaged ] = useState(false);
	const [ lockedUnmanaged, setLockUnmanaged ] = useState(false);
	const [ raiseHandEnabledUnmanaged, setRaiseHandEnabledUnmanaged ] = useState(false);
	const [ localRecordingEnabledUnmanaged, setLocalRecordingEnabledUnmanaged ] = useState(false);
	const [ lockedLock, setLockLock ] = useState(false);
	const [ raiseHandEnabledLock, setRaiseHandEnabledLock ] = useState(false);
	const [ localRecordingEnabledLock, setLocalRecordingEnabledLock ] = useState(false);
	const [ chatEnabledUnmanaged, setChatEnabledUnmanaged ] = useState(false);
	const [ breakoutsEnabledUnmanaged, setBreakoutsEnabledUnmanaged ] = useState(false);
	const [ filesharingEnabledUnmanaged, setFilesharingEnabledUnmanaged ] = useState(false);
	const [ chatEnabledManaged, setChatEnabledManaged ] = useState(false);
	const [ breakoutsEnabledManaged, setBreakoutsEnabledManaged ] = useState(false);
	const [ filesharingEnabledManaged, setFilesharingEnabledManaged ] = useState(false);
	const [ chatEnabledLock, setChatEnabledLock ] = useState(false);
	const [ breakoutsEnabledLock, setBreakoutsEnabledLock ] = useState(false);
	const [ filesharingEnabledLock, setFilesharingEnabledLock ] = useState(false);
	const [ tracker, setTracker ] = useState('');
	const [ maxFileSize, setMaxFileSize ] = useState(0);
	const [ background, setBackground ] = useState('');
	const [ logo, setLogo ] = useState('');
	const [ defaultRoleId, setDefaultRoleId ] = useState(0);
	const [ tenantPermissionLimitRole, setTenantPermissionLimitRole ] = useState(0);
	
	const [ defaultRoleIdOption, setDefaultRoleIdOption ] = useState<Roles | undefined>();
	const [ tenantPermissionLimitRoleOption, setTenantPermissionLimitRoleOption ] = useState<Roles | undefined>();

	const [ cantPatch ] = useState(false);
	const [ cantDelete ] = useState(false);
	const [ tenantId, setTenantId ] = useState(0);

	const [ tenantIdOption, setTenantIdOption ] = useState<Tenant | undefined>();
	const [ tenantIdDisabled, setTenantIdDisabled ] = useState(false);

	async function fetchProduct() {
		
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('tenants')).then((tdata: any) => {
			if (tdata != undefined) {
				dispatch(managamentActions.setTenants(tdata.data));
			}
			setIsLoading(false);
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('roles')).then((tdata: any) => {
			if (tdata != undefined) {
				dispatch(managamentActions.setRoles(tdata.data));
			}
			setIsLoading(false);
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('defaults')).then((tdata: any) => {
			if (tdata != undefined) {
				setData(tdata.data);
			}
			setIsLoading(false);
    
		});

	}

	useEffect(() => {
		// By moving this function inside the effect, we can clearly see the values it uses.
		setIsLoading(true);
		fetchProduct();
	}, []);

	const [ open, setOpen ] = React.useState(false);

	// ADD NEW
	const handleOpen = () => {
		setId(0);
		// try to get current tenantId
		setTenantId(0);
		setTenantIdOption(undefined);
		setTenantIdDisabled(false);

		setNumberLimit(0);
		setLiveNumberLimit(0);
		setUserManagedRoomNumberLimit(0);
		setManagerManagedRoomNumberLimit(0);
		setLockManaged(false);
		setRaiseHandEnabledManaged(false);
		setLocalRecordingEnabledManaged(false);
		setLockUnmanaged(false);
		setRaiseHandEnabledUnmanaged(false);
		setLocalRecordingEnabledUnmanaged(false);
		setLockLock(false);
		setRaiseHandEnabledLock(false);
		setLocalRecordingEnabledLock(false);
		setChatEnabledUnmanaged(false);
		setBreakoutsEnabledUnmanaged(false);
		setFilesharingEnabledUnmanaged(false);
		setChatEnabledManaged(false);
		setBreakoutsEnabledManaged(false);
		setFilesharingEnabledManaged(false);
		setChatEnabledLock(false);
		setBreakoutsEnabledLock(false);
		setFilesharingEnabledLock(false);
		setTracker('');
		setMaxFileSize(0);
		setBackground('');
		setLogo('');
		setDefaultRoleId(0);
		setTenantPermissionLimitRole(0);

		setDefaultRoleIdOption(undefined);
		setTenantPermissionLimitRoleOption(undefined);

		setOpen(true);
	};
	
	const handleClickOpenNoreset = () => {
		// get tenantId from clicked element
		setTenantIdDisabled(false);
		setOpen(true);
	};

	const handleTenantIdChange = (event: SyntheticEvent<Element, Event>, newValue: Tenant) => {
		if (newValue) {
			if (typeof newValue.id != 'number') {
				setTenantId(parseInt(newValue.id));
			} else {
				setTenantId(newValue.id);
			}
			setTenantIdOption(newValue);
		}
	};

	const handleNumberLimit = (event: { target: { value: string; }; }) => {
		setNumberLimit(parseInt(event.target.value));
	};
	const handleLiveNumberLimit = (event: { target: { value: string; }; }) => {
		setLiveNumberLimit(parseInt(event.target.value));
	};
	const handleUserManagedRoomNumberLimit = (event: { target: { value: string; }; }) => {
		setUserManagedRoomNumberLimit(parseInt(event.target.value));
	};
	
	const handleManagerManagedRoomNumberLimit = (event: { target: { value: string; }; }) => {
		setManagerManagedRoomNumberLimit(parseInt(event.target.value));
	};

	const handleTracker = (event: { target: { value: string; }; }) => {
		setTracker(event.target.value);
	};
	
	const handlemaxFileSize = (event: { target: { value: string; }; }) => {
		setMaxFileSize(parseInt(event.target.value));
	};
	
	const handleBackgroundChange = (event: { target: { value: string; }; }) => {
		setBackground(event.target.value);
	};
	const handleLogoChange = (event: { target: { value: string; }; }) => {
		setLogo(event.target.value);
	};

	const handleDefaultRoleId = (event: SyntheticEvent<Element, Event>, newValue: Roles) => {
		if (newValue) {
			if (typeof newValue.id != 'number') {
				setDefaultRoleId(parseInt(newValue.id));
			} else {
				setDefaultRoleId(newValue.id);
			}
			
			// setDefaultRoleIdOption(newValue);
		}
	};

	const handleTenantPermissionLimitRole = (event: SyntheticEvent<Element, Event>, newValue: Roles) => {
		if (newValue) {
			if (typeof newValue.id != 'number') {
				setTenantPermissionLimitRole(parseInt(newValue.id));
			} else {
				setTenantPermissionLimitRole(newValue.id);
			}
			
			// setDefaultRoleIdOption(newValue);
		}
	};

	const handleClose = () => {
		setOpen(false);
	};

	const delTenant = async () => {

		// add new data / mod data / error
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(deleteData(id, 'defaults')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (id === 0) {
			dispatch(createData({ 
				tenantId: tenantId
			}, 'defaults')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		} else if (id != 0) {
			dispatch(patchData(id,
				{
					tenantId: tenantId,
					numberLimit: numberLimit,
					liveNumberLimit: liveNumberLimit,
					userManagedRoomNumberLimit: userManagedRoomNumberLimit,
					managerManagedRoomNumberLimit: managerManagedRoomNumberLimit,
					lockedManaged: lockedManaged,
					raiseHandEnabledManaged: raiseHandEnabledManaged,
					localRecordingEnabledManaged: localRecordingEnabledManaged,
					lockedUnmanaged: lockedUnmanaged,
					raiseHandEnabledUnmanaged: raiseHandEnabledUnmanaged,
					localRecordingEnabledUnmanaged: localRecordingEnabledUnmanaged,
					lockedLock: lockedLock,
					raiseHandEnabledLock: raiseHandEnabledLock,
					localRecordingEnabledLock: localRecordingEnabledLock,
					chatEnabledUnmanaged: chatEnabledUnmanaged,
					breakoutsEnabledUnmanaged: breakoutsEnabledUnmanaged,
					filesharingEnabledUnmanaged: filesharingEnabledUnmanaged,
					chatEnabledManaged: chatEnabledManaged,
					breakoutsEnabledManaged: breakoutsEnabledManaged,
					filesharingEnabledManaged: filesharingEnabledManaged,
					chatEnabledLock: chatEnabledLock,
					breakoutsEnabledLock: breakoutsEnabledLock,
					filesharingEnabledLock: filesharingEnabledLock,
					tracker: tracker,
					maxFileSize: maxFileSize,
					background: background,
					logo: logo,
					defaultRoleId: defaultRoleId,
					tenantPermissionLimitRole: tenantPermissionLimitRole
				}, 'defaults')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		} else {
			dispatch(notificationsActions.enqueueNotification({
				message: 'Name cannot be empty!',
				options: { variant: 'warning' }
			}));
		}

	};
	
	return <>
		<div>
			
			<Button variant="outlined" onClick={() => dispatch(createData({ 
				tenantId: tenantId
			}, 'defaults')).then(() => {
				fetchProduct();
				setOpen(false);
			})}>
				{addNewLabel()}
			</Button>
			<hr />
			<Dialog open={open} onClose={handleClose}>
				<DialogTitle>{manageItemLabel()}</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{genericItemDescLabel()}
					</DialogContentText>
					<input type="hidden" name="id" value={id} />
					<Grid container spacing={1}>
						<Grid size={12}>
							<Autocomplete
								options={tenants}
								getOptionLabel={(option) => option.name}
								fullWidth
								disableClearable
								id="combo-box-demo"
								readOnly={tenantIdDisabled}
								onChange={handleTenantIdChange}
								value={tenantIdOption}
								sx={{ marginTop: '8px' }}
								renderInput={(params) => <TextField {...params} label={tenantLabel()} />}
							/>
						</Grid>
						<Grid size={6}>
							<TextField
								autoFocus
								margin="dense"
								id="numberLimit"
								label={'numberLimit'}
								type="number"
								fullWidth
								disabled={false}
								onChange={handleNumberLimit}
								value={numberLimit}
							/>
						</Grid>
						<Grid size={6}>
							<TextField
								margin="dense"
								id="liveNumberLimit"
								label={'liveNumberLimit'}
								type="number"
								fullWidth
								disabled={false}
								onChange={handleLiveNumberLimit}
								value={liveNumberLimit}
							/>
						</Grid>
						<Grid size={6}>
							<TextField
								margin="dense"
								id="numberLimit"
								label={'userManagedRoomNumberLimit'}
								type="number"
								fullWidth
								disabled={false}
								onChange={handleUserManagedRoomNumberLimit}
								value={userManagedRoomNumberLimit}
							/>
						</Grid>
						
						<Grid size={6}>
							<TextField
								margin="dense"
								id="managerManagedRoomNumberLimit"
								label={'managerManagedRoomNumberLimit'}
								type="number"
								fullWidth
								disabled={!superAdmin}
								onChange={handleManagerManagedRoomNumberLimit}
								value={managerManagedRoomNumberLimit}
							/>
						</Grid>

						<table
							style={{
								borderCollapse: 'collapse',
								textAlign: 'center',
								// margin: '20px auto',
								// border: '1px solid #000000ff',
								width: '100%'

							}}
						>
							<thead>
								<tr>
									<th>Room option state </th>
									<th>(managed function override?)</th>
									<th>(unmanaged)</th>
									<th>Configuration Lock</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Room locked</td>
									<td><Checkbox disabled={lockedLock && !superAdmin} checkedIcon={<ToggleOnIcon />} icon={<BlockIcon />} checked={lockedManaged} onClick={() => setLockManaged(Boolean(!lockedManaged))} /></td>
									<td><Checkbox disabled={lockedLock && !superAdmin} checked={lockedUnmanaged} onClick={() => setLockUnmanaged(Boolean(!lockedUnmanaged))} /></td>
									<td><Checkbox disabled={!superAdmin} checkedIcon={<LockIcon />} icon={<LockOpenIcon />} checked={lockedLock} onClick={() => setLockLock(Boolean(!lockedLock))} /></td>
								</tr>
								<tr>
									<td>Raise Hand</td>
									<td><Checkbox disabled={raiseHandEnabledLock && !superAdmin} checkedIcon={<ToggleOnIcon />} icon={<BlockIcon />} checked={raiseHandEnabledManaged} onClick={() => setRaiseHandEnabledManaged(Boolean(!raiseHandEnabledManaged))}/></td>
									<td><Checkbox disabled={raiseHandEnabledLock && !superAdmin} checked={raiseHandEnabledUnmanaged} onClick={() => setRaiseHandEnabledUnmanaged(Boolean(!raiseHandEnabledUnmanaged))}/></td>
									<td><Checkbox disabled={!superAdmin} checkedIcon={<LockIcon />} icon={<LockOpenIcon />} checked={raiseHandEnabledLock} onClick={() => setRaiseHandEnabledLock(Boolean(!raiseHandEnabledLock))}/></td>
								</tr>
								<tr>
									<td>Local Recording</td>
									<td><Checkbox disabled={localRecordingEnabledLock && !superAdmin} checkedIcon={<ToggleOnIcon />} icon={<BlockIcon />} checked={localRecordingEnabledManaged} onClick={() => setLocalRecordingEnabledManaged(Boolean(!localRecordingEnabledManaged))} /></td>
									<td><Checkbox disabled={localRecordingEnabledLock && !superAdmin} checked={localRecordingEnabledUnmanaged} onClick={() => setLocalRecordingEnabledUnmanaged(Boolean(!localRecordingEnabledUnmanaged))} /></td>
									<td><Checkbox disabled={!superAdmin} checkedIcon={<LockIcon />} icon={<LockOpenIcon />} checked={localRecordingEnabledLock} onClick={() => setLocalRecordingEnabledLock(Boolean(!localRecordingEnabledLock))} /></td>
								</tr>
								<tr>
									<td>Chat service</td>
									<td><Checkbox disabled={chatEnabledLock && !superAdmin} checkedIcon={<ToggleOnIcon />} icon={<BlockIcon />} checked={chatEnabledManaged} onClick={() => setChatEnabledManaged(Boolean(!chatEnabledManaged))} /></td>
									<td><Checkbox disabled={chatEnabledLock && !superAdmin} checked={chatEnabledUnmanaged} onClick={() => setChatEnabledUnmanaged(Boolean(!chatEnabledUnmanaged))} /></td>
									<td><Checkbox disabled={!superAdmin} checkedIcon={<LockIcon />} icon={<LockOpenIcon />} checked={chatEnabledLock} onClick={() => setChatEnabledLock(Boolean(!chatEnabledLock))} /></td>
								</tr>
								<tr>
									<td>Breakout rooms service</td>
									<td><Checkbox disabled={breakoutsEnabledLock && !superAdmin} checkedIcon={<ToggleOnIcon />} icon={<BlockIcon />} checked={breakoutsEnabledManaged} onClick={() => setBreakoutsEnabledManaged(Boolean(!breakoutsEnabledManaged))} /></td>
									<td><Checkbox disabled={breakoutsEnabledLock && !superAdmin} checked={breakoutsEnabledUnmanaged} onClick={() => setBreakoutsEnabledUnmanaged(Boolean(!breakoutsEnabledUnmanaged))} /></td>
									<td><Checkbox disabled={!superAdmin} checkedIcon={<LockIcon />} icon={<LockOpenIcon />} checked={breakoutsEnabledLock} onClick={() => setBreakoutsEnabledLock(Boolean(!breakoutsEnabledLock))} /></td>
								</tr>
								<tr>
									<td>Filesharing service</td>
									<td><Checkbox disabled={filesharingEnabledLock && !superAdmin} checkedIcon={<ToggleOnIcon />} icon={<BlockIcon />} checked={filesharingEnabledManaged} onClick={() => setFilesharingEnabledManaged(Boolean(!filesharingEnabledManaged))} /></td>
									<td><Checkbox disabled={filesharingEnabledLock && !superAdmin} checked={filesharingEnabledUnmanaged} onClick={() => setFilesharingEnabledUnmanaged(Boolean(!filesharingEnabledUnmanaged))} /></td>
									<td><Checkbox disabled={!superAdmin} checkedIcon={<LockIcon />} icon={<LockOpenIcon />} checked={filesharingEnabledLock} onClick={() => setFilesharingEnabledLock(Boolean(!filesharingEnabledLock))} /></td>
								</tr>
							</tbody>
						</table>
						<Grid size={8}>

							<TextField
								margin="dense"
								id="tracker"
								label={'tracker'}
								type="text"
								fullWidth
								disabled={false}
								onChange={handleTracker}
								value={tracker}
							/>
						</Grid>
						<Grid size={4}>
							<TextField
								margin="dense"
								id="maxFileSize"
								label={'File upload size'}
								type="number"
								fullWidth
								disabled={false}
								onChange={handlemaxFileSize}
								value={maxFileSize}
								InputProps={{
									endAdornment: <InputAdornment position="end">MB</InputAdornment>,
								}}
							/>
						</Grid>
						<TextField
							margin="dense"
							id="background"
							label={'Background Image'}
							type="text"
							fullWidth
							disabled={false}
							onChange={handleBackgroundChange}
							value={background}
						/>
						<TextField
							margin="dense"
							id="Logo"
							label={'Logo URL'}
							type="text"
							fullWidth
							disabled={false}
							onChange={handleLogoChange}
							value={logo}
						/>
						<Autocomplete
							options={roles}
							getOptionLabel={(option) => option.name}
							fullWidth
							disableClearable
							onChange={handleDefaultRoleId}
							value={defaultRoleIdOption}
							sx={{ marginTop: '8px' }}
							renderInput={(params) => <TextField {...params} label={'defaultRoleId'} />}
							
						/>
						<Autocomplete
							options={roles}
							getOptionLabel={(option) => option.name}
							fullWidth
							disableClearable
							onChange={handleTenantPermissionLimitRole}
							value={tenantPermissionLimitRoleOption}
							sx={{ marginTop: '8px' }}
							renderInput={(params) => <TextField {...params} label={'tenantPermissionLimitRole'} />}
						/>
					</Grid>
					
				</DialogContent>
				<DialogActions>
					<Button onClick={delTenant} disabled={cantDelete} color='warning'>{deleteLabel()}</Button>
					<Button onClick={handleClose}>{cancelLabel()}</Button>
					<Button onClick={addTenant} disabled={cantPatch}>{applyLabel()}</Button>
				</DialogActions>
			</Dialog>
		</div>
		<MaterialReactTable
			muiTableBodyRowProps={({ row }) => ({
				onClick: () => {

					const r = row.getAllCells();

					const tid = r[0].getValue();
					const ttenantId = r[1].getValue();

					if (typeof tid === 'number') {
						setId(tid);
					} else if (typeof tid == 'string') {
						setId(parseInt(tid));
					}

					if (typeof ttenantId === 'number') {
						const ttenant = tenants.find((x) => x.id == ttenantId);

						if (ttenant) {
							setTenantIdOption(ttenant);
						}
						setTenantId(ttenantId);
					} else if (typeof ttenantId === 'string') {
						const ttenant = tenants.find((x) => x.id == parseInt(ttenantId));

						if (ttenant) {
							setTenantIdOption(ttenant);
						}
						setTenantId(parseInt(ttenantId));
					} else {
						setTenantId(0);
					}
			
					const d = data.find((dt) => dt.id == tid);

					if (d) {
						setNumberLimit(parseInt(d.numberLimit));
						setLiveNumberLimit(parseInt(d.liveNumberLimit));
						setUserManagedRoomNumberLimit(parseInt(d.userManagedRoomNumberLimit));
						setManagerManagedRoomNumberLimit(parseInt(d.managerManagedRoomNumberLimit));
						setLockManaged(Boolean(d.lockedManaged));
						setRaiseHandEnabledManaged(Boolean(d.raiseHandEnabledManaged));
						setLocalRecordingEnabledManaged(Boolean(d.localRecordingEnabledManaged));
						setLockUnmanaged(Boolean(d.lockedUnmanaged));
						setRaiseHandEnabledUnmanaged(Boolean(d.raiseHandEnabledUnmanaged));
						setLocalRecordingEnabledUnmanaged(Boolean(d.localRecordingEnabledUnmanaged));
						setLockLock(Boolean(d.lockedLock));
						setRaiseHandEnabledLock(Boolean(d.raiseHandEnabledLock));
						setLocalRecordingEnabledLock(Boolean(d.localRecordingEnabledLock));
						setChatEnabledUnmanaged(Boolean(d.chatEnabledUnmanaged));
						setBreakoutsEnabledUnmanaged(Boolean(d.breakoutsEnabledUnmanaged));
						setFilesharingEnabledUnmanaged(Boolean(d.filesharingEnabledUnmanaged));
						setChatEnabledManaged(Boolean(d.chatEnabledManaged));
						setBreakoutsEnabledManaged(Boolean(d.breakoutsEnabledManaged));
						setFilesharingEnabledManaged(Boolean(d.filesharingEnabledManaged));
						setChatEnabledLock(Boolean(d.chatEnabledLock));
						setBreakoutsEnabledLock(Boolean(d.breakoutsEnabledLock));
						setFilesharingEnabledLock(Boolean(d.filesharingEnabledLock));
						setTracker(d.tracker || '');
						setMaxFileSize(parseInt(d.maxFileSize));
						setBackground(d.background || '');
						setLogo(d.logo || '');
						setDefaultRoleId(parseInt(d.defaultRoleId));
						// eslint-disable-next-line no-shadow
						setDefaultRoleIdOption(roles.find((r) => parseInt(d.defaultRoleId)==r.id)|| undefined);
						setTenantPermissionLimitRole(parseInt(d.tenantPermissionLimitRole));
						// eslint-disable-next-line no-shadow
						setTenantPermissionLimitRoleOption(roles.find((r) => parseInt(d.tenantPermissionLimitRole) == r.id)|| undefined);
					}
					handleClickOpenNoreset();

				}
			})}
			columns={columns}
			data={data} // fallback to array if data is undefined
			initialState={{
				columnVisibility: {
				}
			}}
			state={{ isLoading }}
		/>
	</>;
};

export default DefaultTable;

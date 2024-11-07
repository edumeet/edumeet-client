import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, FormControlLabel, Checkbox, Autocomplete, Snackbar } from '@mui/material';
import React from 'react';
import MuiAlert, { AlertColor, AlertProps } from '@mui/material/Alert';
import { GroupRoles, Roles, Room, RoomOwners, Tenant, User } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createRoomWithParams, deleteRoom, getRoles, getRooms, getTenants, getUsers, modifyRoom } from '../../../store/actions/managementActions';

// nested data is ok, see accessorKeys in ColumnDef below

const RoomTable = () => {
	const dispatch = useAppDispatch();

	const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
		props,
		ref,
	) {
		return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
	});

	type TenantOptionTypes = Array<Tenant>

	const [ tenants, setTenants ] = useState<TenantOptionTypes>([ { 'id': 0, 'name': '', 'description': '' } ]);

	type RoleTypes = Array<Roles>

	const [ roles, setRoles ] = useState<RoleTypes>([ { 'description': 'Test', 'id': 1, 'name': 'Test', 'tenantId': 1, 'permissions': [] } ]);

	const [ alertOpen, setAlertOpen ] = React.useState(false);
	const [ alertMessage, setAlertMessage ] = React.useState('');
	const [ alertSeverity, setAlertSeverity ] = React.useState<AlertColor>('success');

	const getTenantName = (id: string): string => {
		const t = tenants.find((type) => type.id === parseInt(id));

		if (t && t.name) {
			return t.name;
		} else {
			return 'undefined tenant';
		}
	};

	const getRoleName = (id: string): string => {
		const t = roles.find((type) => type.id === parseInt(id));

		if (t && t.name) {
			return t.name;
		} else {
			return 'No default role';
		}
	};

	type UserTypes = Array<User>

	const [ users, setUsers ] = useState<UserTypes>([ {
		'id': 0,
		'ssoId': '',
		'tenantId': 0,
		'email': '',
		'name': '',
		'avatar': '',
		'roles': [],
		'tenantAdmin': false,
		'tenantOwner': false
	} ]);

	const getUserEmail = (id: number): string => {
		const t = users.find((type) => type.id == id);

		if (t && t.email) {
			return t.email;
		} else {
			return 'no such email';
		}
	};

	// should be memoized or stable
	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<Room>[]>(
		() => [

			{
				accessorKey: 'id',
				header: '#'
			},
			{
				accessorKey: 'name',
				header: 'Name'
			},
			{
				accessorKey: 'description',
				header: 'Desc'
			},
			{
				accessorKey: 'createdAt',
				header: 'Created at',
				Cell: ({ cell }) => new Date(parseInt(cell.getValue<string>())).toLocaleString()
			},
			{
				accessorKey: 'updatedAt',
				header: 'Updated at',
				Cell: ({ cell }) => new Date(parseInt(cell.getValue<string>())).toLocaleString()
			},
			{
				accessorKey: 'creatorId',
				header: 'Creator id'
			},
			{
				accessorKey: 'defaultRoleId',
				header: 'Default Role',
				Cell: ({ cell }) => getRoleName(cell.getValue<string>())

			},
			{
				accessorKey: 'tenantId',
				header: 'Tenant',
				Cell: ({ cell }) => getTenantName(cell.getValue<string>())
			},
			{
				accessorKey: 'logo',
				header: 'Logo'
			},
			{
				accessorKey: 'background',
				header: 'Background'
			},
			{
				accessorKey: 'maxActiveVideos',
				header: 'Max Active Videos',
			},
			{
				accessorKey: 'locked',
				header: 'Locked',
				Cell: ({ cell }) =>
					(cell.getValue() === true ? 'yes' : 'no'),
				filterVariant: 'checkbox'
			},
			{
				accessorKey: 'chatEnabled',
				header: 'Chat Enabled',
				Cell: ({ cell }) =>
					(cell.getValue() === true ? 'yes' : 'no'),
				filterVariant: 'checkbox'
			},
			{
				accessorKey: 'raiseHandEnabled',
				header: 'Raise Hand Enabled',
				Cell: ({ cell }) =>
					(cell.getValue() === true ? 'yes' : 'no'),
				filterVariant: 'checkbox'
			},
			{
				accessorKey: 'filesharingEnabled',
				header: 'Filesharing Enabled',
				Cell: ({ cell }) =>
					(cell.getValue() === true ? 'yes' : 'no'),
				filterVariant: 'checkbox'
			},
			{
				accessorKey: 'localRecordingEnabled',
				header: 'Local Recording Enabled',
				Cell: ({ cell }) =>
					(cell.getValue() === true ? 'yes' : 'no'),
				filterVariant: 'checkbox'
				
			},

			{
				accessorKey: 'owners',
				header: 'owners',
				Cell: ({ cell }) =>
					(	
						cell.getValue<Array<RoomOwners>>().map((single:RoomOwners) => getUserEmail(single.userId))
							.join(', ')
					),
			},
			{
				accessorKey: 'groupRoles',
				header: 'groupRoles',
				Cell: ({ cell }) =>
					(	
						cell.getValue<Array<GroupRoles>>().map((single:GroupRoles) => single.role.description)
							.join(', ')
					),
			},
			{
				accessorKey: 'breakoutsEnabled',
				header: 'Breakouts Enabled',
				Cell: ({ cell }) =>
					(cell.getValue() === true ? 'yes' : 'no'),
				filterVariant: 'checkbox'
			},
			
		],
		[ tenants, roles, users ],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ name, setName ] = useState('');
	const [ nameDisabled, setNameDisabled ] = useState(false);
	const [ description, setDescription ] = useState('');
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
	const [ tenantId, setTenantId ] = useState(0);
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
	const [ defaultRoleId, setDefaultRoletId ] = useState(0);

	const [ breakoutsEnabled, setBreakoutsEnabled ] = useState(false);

	const [ logo, setLogo ] = useState('');
	const [ background, setBackground ] = useState('');
	const [ maxActiveVideos, setMaxActiveVideos ] = useState(0);
	const [ locked, setLocked ] = useState(false);
	const [ chatEnabled, setChatEnabled ] = useState(false);
	const [ raiseHandEnabled, setRaiseHandEnabled ] = useState(false);
	const [ filesharingEnabled, setFilesharingEnabled ] = useState(false);
	const [ localRecordingEnabled, setLocalRecordingEnabled ] = useState(false);
	const [ tenantIdOption, setTenantIdOption ] = useState<Tenant | undefined>();
	const [ defaultRoleIdOption, setDefaultRoleIdOption ] = useState<Roles | undefined>();

	const [ cantPatch ] = useState(false);
	const [ cantDelete ] = useState(false);

	async function fetchProduct() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getUsers()).then((tdata: any) => {
			// eslint-disable-next-line no-console
			console.log('User data', tdata);
			if (tdata != undefined) {
				setUsers(tdata.data);
			}
			setIsLoading(false);

		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getTenants()).then((tdata: any) => {
			// eslint-disable-next-line no-console
			console.log('Tenant data', tdata);
			if (tdata != undefined) {
				setTenants(tdata.data);
			}
			setIsLoading(false);
    
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getRoles()).then((tdata: any) => {
			// eslint-disable-next-line no-console
			console.log('Role data', tdata);
			if (tdata != undefined) {
				setRoles(tdata.data);
			}
			setIsLoading(false);
    
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getRooms()).then((tdata: any) => {
			// eslint-disable-next-line no-console
			console.log('Rooms data', tdata);
			if (tdata != undefined) {
				setData(tdata.data);
			}
			setIsLoading(false);
    
		});

		setIsLoading(false);

	}

	useEffect(() => {
		// By moving this function inside the effect, we can clearly see the values it uses.
		setIsLoading(true);
		fetchProduct();
	}, []);

	const [ open, setOpen ] = React.useState(false);

	const handleClickOpen = () => {
		setId(0);
		setNameDisabled(false);
		setName('');
		setDescription('');
		setTenantId(0);
		setTenantIdOption(undefined);
		setDefaultRoletId(0);
		setDefaultRoleIdOption(undefined);
		setLogo('');
		setBackground('');
		setMaxActiveVideos(0);
		setLocked(true);
		setChatEnabled(true);
		setRaiseHandEnabled(true);
		setFilesharingEnabled(true);
		setLocalRecordingEnabled(true);
		setBreakoutsEnabled(true);

		setOpen(true);
	};

	const handleClickOpenNoreset = () => {
		setNameDisabled(true);
		setOpen(true);
	};

	const handleNameChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setName(event.target.value);
	};
	const handleDescriptionChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setDescription(event.target.value);
	};

	const handleDefaultRoleIdChange = (event: SyntheticEvent<Element, Event>, newValue: Roles) => {
		if (newValue) {
			setDefaultRoletId(newValue.id);
			setDefaultRoleIdOption(newValue);
		}
	};

	/* const handleTenantIdChange = (event: SyntheticEvent<Element, Event>, newValue: Tenant) => {
		if (newValue) {
			setTenantId(newValue.id);
			setTenantIdOption(newValue);
		}
	}; */

	const handleLogoChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setLogo(event.target.value);
	};
	const handleBackgroundChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setBackground(event.target.value);
	};
	const handleMaxActiveVideosChange = (event: { target: { value: string; }; }) => {
		setMaxActiveVideos(parseInt(event.target.value));
	};
	const handleLockedChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setLocked(event.target.checked);
	};
	const handleChatEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setChatEnabled(event.target.checked);
	};
	const handleRaiseHandEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setRaiseHandEnabled(event.target.checked);
	};
	const handleFilesharingEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setFilesharingEnabled(event.target.checked);
	};
	const handleLocalRecordingEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setLocalRecordingEnabled(event.target.checked);
	};
	const handleBreakoutsEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setBreakoutsEnabled(event.target.checked);
	};
	const handleClose = () => {
		setOpen(false);
	};

	const delTenant = async () => {

		// add new data / mod data / error
		// eslint-disable-next-line no-alert
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(deleteRoom(id)).then((tdata: any) => {
				// eslint-disable-next-line no-console
				console.log('User data', tdata);
				fetchProduct();
				setOpen(false);
				setAlertMessage('Successfull delete!');
				setAlertSeverity('success');
				setAlertOpen(true);
			});
		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (name != '' && id === 0) {

			dispatch(createRoomWithParams({ 
				name: name,
				description: description,
				logo: logo,
				background: background,
				maxActiveVideos: maxActiveVideos,
				locked: locked,
				chatEnabled: chatEnabled,
				raiseHandEnabled: raiseHandEnabled,
				filesharingEnabled: filesharingEnabled,
				localRecordingEnabled: localRecordingEnabled,
				breakoutsEnabled: breakoutsEnabled
			})).then((tdata: unknown) => {
				// eslint-disable-next-line no-console
				console.log('User data', tdata);
				fetchProduct();
				setOpen(false);
				// TODO finish
				setAlertMessage('Successfull add!');
				setAlertSeverity('success');
				setAlertOpen(true);
	
			});

		} else if (name != '' && id != 0) {
			const obj : Room= {
				description: description,
				logo: logo,
				background: background,
				maxActiveVideos: maxActiveVideos,
				locked: locked,
				chatEnabled: chatEnabled,
				raiseHandEnabled: raiseHandEnabled,
				filesharingEnabled: filesharingEnabled,
				localRecordingEnabled: localRecordingEnabled,
				breakoutsEnabled: breakoutsEnabled,
			};
			
			if (defaultRoleId) {
				obj.defaultRoleId=defaultRoleId;
			}
			dispatch(modifyRoom(id, obj)).then((tdata: unknown) => {
				// eslint-disable-next-line no-console
				console.log('Room data', tdata);
				// TODO finish
				fetchProduct();
				setOpen(false);
				setAlertMessage('Successfull modify!');
				setAlertSeverity('success');
				setAlertOpen(true);

			});
            
		}

	};

	const handleAlertClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
		if (reason === 'clickaway') {
			return;
		}
  
		setAlertOpen(false);
	};
	
	return <>
		<div>
			<Button variant="outlined" onClick={() => handleClickOpen()}>
				Add new
			</Button>
			<hr/>
			<Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleAlertClose}>
				<Alert onClose={handleAlertClose} severity={alertSeverity} sx={{ width: '100%' }}>
					{alertMessage}
				</Alert>
			</Snackbar>
			<Dialog open={open} onClose={handleClose}>
				<DialogTitle>Add/Edit</DialogTitle>
				<DialogContent>
					<DialogContentText>
						These are the parameters that you can change.
					</DialogContentText>
					<input type="hidden" name="id" value={id} />
					<TextField
						autoFocus
						margin="dense"
						id="name"
						label="name"
						type="text"
						required
						fullWidth
						onChange={handleNameChange}
						value={name}
						disabled={nameDisabled}
					/>
					<TextField
						autoFocus
						margin="dense"
						id="description"
						label="description"
						type="text"
						required
						fullWidth
						onChange={handleDescriptionChange}
						value={description}
					/>
					{/* <TextField
						autoFocus
						margin="dense"
						id="tenantId"
						label="tenantId"
						type="number"
						disabled
						required
						fullWidth
						onChange={handleTenantIdChange}
						value={tenantId}
					/> */}
					<Autocomplete
						options={roles}
						getOptionLabel={(option) => option.name}
						fullWidth
						disableClearable
						onChange={handleDefaultRoleIdChange}
						value={defaultRoleIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label="Default Role" />}
					/>
					<Autocomplete
						options={tenants}
						getOptionLabel={(option) => option.name}
						fullWidth
						disableClearable
						readOnly
						// onChange={handleTenantIdChange}
						value={tenantIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label="Tenant" />}
					/>
					<TextField
						autoFocus
						margin="dense"
						id="logo"
						label="logo"
						type="text"
						required
						fullWidth
						onChange={handleLogoChange}
						value={logo}
					/>
					<TextField
						autoFocus
						margin="dense"
						id="background"
						label="background"
						type="text"
						required
						fullWidth
						onChange={handleBackgroundChange}
						value={background}
					/>
					<TextField
						autoFocus
						margin="dense"
						id="maxActiveVideos"
						label="maxActiveVideos"
						type="number"
						required
						fullWidth
						onChange={handleMaxActiveVideosChange}
						value={maxActiveVideos}
					/>
					<FormControlLabel control={<Checkbox checked={locked} onChange={handleLockedChange} />} label="locked" />
					<FormControlLabel control={<Checkbox checked={chatEnabled} onChange={handleChatEnabledChange} />} label="chatEnabled" />
					<FormControlLabel control={<Checkbox checked={raiseHandEnabled} onChange={handleRaiseHandEnabledChange} />} label="raiseHandEnabled" />
					<FormControlLabel control={<Checkbox checked={filesharingEnabled} onChange={handleFilesharingEnabledChange} />} label="filesharingEnabled" />
					<FormControlLabel control={<Checkbox checked={localRecordingEnabled} onChange={handleLocalRecordingEnabledChange} />} label="localRecordingEnabled" />
					<FormControlLabel control={<Checkbox checked={breakoutsEnabled} onChange={handleBreakoutsEnabledChange} />} label="breakoutsEnabled" />
					
				</DialogContent>
				<DialogActions>
					<Button onClick={delTenant} disabled={cantDelete} color='warning'>Delete</Button>
					<Button onClick={handleClose}>Cancel</Button>
					<Button onClick={addTenant} disabled={cantPatch}>OK</Button>
				</DialogActions>
			</Dialog>
		</div>
		<MaterialReactTable
			muiTableBodyRowProps={({ row }) => ({
				onClick: () => {

					const r = row.getAllCells();

					const tid = r[0].getValue();
					const tname=r[1].getValue();
					const tdescription=r[2].getValue();
					const tdefaultroleId=r[6].getValue();
					const ttenantId=r[7].getValue();
					const tlogo=r[8].getValue();
					const tbackground=r[9].getValue();
					const tmaxActiveVideos=r[10].getValue();
					const tlocked=r[11].getValue();
					const tchatEnabled=r[12].getValue();
					const traiseHandEnabled=r[13].getValue();
					const tfilesharingEnabled=r[14].getValue();
					const tlocalRecordingEnabled=r[15].getValue();
					const tbreakoutsEnabled=r[18].getValue();

					if (typeof tid === 'number') {
						setId(tid);
					}
					if (typeof tname === 'string') {
						setName(tname);
					} else {
						setName('');
					}
					if (typeof tdescription === 'string') {
						setDescription(tdescription);
					} else {
						setDescription('');
					}

					if (typeof tdefaultroleId === 'string') {
						const tdefaultrole = roles.find((x) => x.id === parseInt(tdefaultroleId));

						if (tdefaultrole) {
							setDefaultRoleIdOption(tdefaultrole);
						} else {
							setDefaultRoleIdOption(undefined);
						}
						setDefaultRoletId(parseInt(tdefaultroleId));
					} else {
						setDefaultRoletId(0);
						setDefaultRoleIdOption(undefined);
					}
					if (typeof ttenantId === 'string') {
						const ttenant = tenants.find((x) => x.id === parseInt(ttenantId));

						if (ttenant) {
							setTenantIdOption(ttenant);
						}
						setTenantId(parseInt(ttenantId));
					} else {
						setTenantId(0);
					}

					if (typeof tlogo === 'string') {
						setLogo(tlogo);
					} else {
						setLogo('');
					}
					if (typeof tbackground === 'string') {
						setBackground(tbackground);
					} else {
						setBackground('');
					}
					if (typeof tmaxActiveVideos === 'number') {
						setMaxActiveVideos(tmaxActiveVideos);
					} else {
						setMaxActiveVideos(0);
					}

					if (tlocked === true) {
						setLocked(true);
					} else {
						setLocked(false);
					}
					if (tchatEnabled === true) {
						setChatEnabled(true);
					} else {
						setChatEnabled(false);
					}
					if (traiseHandEnabled === true) {
						setRaiseHandEnabled(true);
					} else {
						setRaiseHandEnabled(false);
					}
					if (tfilesharingEnabled === true) {
						setFilesharingEnabled(true);
					} else {
						setFilesharingEnabled(false);
					}
					if (tlocalRecordingEnabled === true) {
						setLocalRecordingEnabled(true);
					} else {
						setLocalRecordingEnabled(false);
					}
					if (tbreakoutsEnabled === true) {
						setBreakoutsEnabled(true);
					} else {
						setBreakoutsEnabled(false);
					}

					handleClickOpenNoreset();

				}
			})}
			columns={columns}
			data={data} // fallback to array if data is undefined
			initialState={{
				columnVisibility: {
					updatedAt: false,
					creatorId: false,
					createdAt: false,
					ssoId: false,
					breakoutsEnabled: false,
					// tenantId: false,
					logo: false,
					background: false,
					maxActiveVideos: false,
					locked: false,
					chatEnabled: false,
					raiseHandEnabled: false,
					filesharingEnabled: false,
					localRecordingEnabled: false,
				}
			}}
			state={{ isLoading }}
		/>
	</>;
};

export default RoomTable;

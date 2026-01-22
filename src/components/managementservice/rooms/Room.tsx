import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, FormControlLabel, Checkbox, Autocomplete } from '@mui/material';
import React from 'react';
import { GroupRoles, Roles, Room, RoomOwners, Tenant, User } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createRoomWithParams, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import RoomOwnerTable from './RoomOwner';
import RoomUserRoleTable from './roomUserRole';
import { addNewLabel, applyLabel, breakoutsEnabledLabel, cancelLabel, chatEnabledLabel, defaultRoleLabel, deleteLabel, descLabel, filesharingEnabledLabel, genericItemDescLabel, groupRolesLabel, localRecordingEnabledLabel, lockRoomLabel, logoLabel, manageItemLabel, maxActiveVideosLabel, nameLabel, noLabel, ownersLabel, raiseHandEnabledLabel, reactionsEnabledLabel, roomBgLabel, roomLockedLabel, tenantLabel, undefinedLabel, yesLabel } from '../../translated/translatedComponents';

export interface RoomProp {
	roomId: number;
}

const RoomTable = () => {
	const dispatch = useAppDispatch();

	type TenantOptionTypes = Array<Tenant>

	const [ tenants, setTenants ] = useState<TenantOptionTypes>([ { 'id': 0, 'name': '', 'description': '' } ]);

	type RoleTypes = Array<Roles>

	const [ roles, setRoles ] = useState<RoleTypes>([ { 'description': 'Test', 'id': 1, 'name': 'Test', 'tenantId': 1, 'permissions': [] } ]);

	const getTenantName = (id: string): string => {
		const t = tenants.find((type) => type.id == parseInt(id));

		if (t && t.name) {
			return t.name;
		} else {
			return `${undefinedLabel()} ${tenantLabel()}`;
		}
	};

	const getRoleName = (id: string): string => {
		const t = roles.find((type) => type.id == parseInt(id));

		if (t && t.name) {
			return t.name;
		} else {
			return '-';
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
			return 'Hidden email';
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
				header: nameLabel()
			},
			{
				accessorKey: 'description',
				header: descLabel()
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
				header: defaultRoleLabel(),
				Cell: ({ cell }) => getRoleName(cell.getValue<string>())

			},
			{
				accessorKey: 'tenantId',
				header: tenantLabel(),
				Cell: ({ cell }) => getTenantName(cell.getValue<string>())
			},
			{
				accessorKey: 'logo',
				header: logoLabel()
			},
			{
				accessorKey: 'background',
				header: roomBgLabel()
			},
			{
				accessorKey: 'maxActiveVideos',
				header: maxActiveVideosLabel(),
			},
			{
				accessorKey: 'locked',
				header: roomLockedLabel(),
				Cell: ({ cell }) =>
					(cell.getValue() === true ? yesLabel() : noLabel()),
				filterVariant: 'checkbox'
			},
			{
				accessorKey: 'chatEnabled',
				header: chatEnabledLabel(),
				Cell: ({ cell }) =>
					(cell.getValue() === true ? yesLabel() : noLabel()),
				filterVariant: 'checkbox'
			},
			{
				accessorKey: 'raiseHandEnabled',
				header: raiseHandEnabledLabel(),
				Cell: ({ cell }) =>
					(cell.getValue() === true ? yesLabel() : noLabel()),
				filterVariant: 'checkbox'
			},
			{
				accessorKey: 'reactionsEnabled',
				header: reactionsEnabledLabel(),
				Cell: ({ cell }) =>
					(cell.getValue() === true ? yesLabel() : noLabel()),
				filterVariant: 'checkbox'
			},
			{
				accessorKey: 'filesharingEnabled',
				header: filesharingEnabledLabel(),
				Cell: ({ cell }) =>
					(cell.getValue() === true ? yesLabel() : noLabel()),
				filterVariant: 'checkbox'
			},
			{
				accessorKey: 'localRecordingEnabled',
				header: localRecordingEnabledLabel(),
				Cell: ({ cell }) =>
					(cell.getValue() === true ? yesLabel() : noLabel()),
				filterVariant: 'checkbox'
				
			},

			{
				accessorKey: 'owners',
				header: ownersLabel(),
				Cell: ({ cell }) =>
					(	
						cell.getValue<Array<RoomOwners>>().map((single:RoomOwners) => getUserEmail(single.userId))
							.join(', ')
					),
			},
			{
				accessorKey: 'groupRoles',
				header: groupRolesLabel(),
				Cell: ({ cell }) =>
					(	
						cell.getValue<Array<GroupRoles>>().map((single:GroupRoles) => single.role.description)
							.join(', ')
					),
			},
			{
				accessorKey: 'breakoutsEnabled',
				header: breakoutsEnabledLabel(),
				Cell: ({ cell }) =>
					(cell.getValue() === true ? yesLabel() : noLabel()),
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
	const [ tenantId, setTenantId ] = useState(0);
	const [ defaultRoleId, setDefaultRoletId ] = useState(0);

	const [ breakoutsEnabled, setBreakoutsEnabled ] = useState(false);

	const [ logo, setLogo ] = useState('');
	const [ background, setBackground ] = useState('');
	const [ maxActiveVideos, setMaxActiveVideos ] = useState(0);
	const [ locked, setLocked ] = useState(false);
	const [ chatEnabled, setChatEnabled ] = useState(false);
	const [ raiseHandEnabled, setRaiseHandEnabled ] = useState(false);
	const [ reactionsEnabled, setReactionsEnabled ] = useState(false);
	const [ filesharingEnabled, setFilesharingEnabled ] = useState(false);
	const [ localRecordingEnabled, setLocalRecordingEnabled ] = useState(false);

	const [ tenantIdOption, setTenantIdOption ] = useState<Tenant | undefined>();
	
	const [ defaultRoleIdOption, setDefaultRoleIdOption ] = useState<Roles | undefined>();

	const [ cantPatch ] = useState(false);
	const [ cantDelete ] = useState(false);

	async function fetchProduct() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('users')).then((tdata: any) => {
			if (tdata != undefined) {
				setUsers(tdata.data);
			}
			setIsLoading(false);

		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('tenants')).then((tdata: any) => {
			if (tdata != undefined) {
				setTenants(tdata.data);
			}
			setIsLoading(false);
    
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('roles')).then((tdata: any) => {
			if (tdata != undefined) {
				setRoles(tdata.data);
			}
			setIsLoading(false);
    
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('rooms')).then((tdata: any) => {
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

		// tenant selectable on add
		if (tenants.length === 1) {
			const onlyTenant = tenants[0];
			const onlyTenantId = Number(onlyTenant.id);

			setTenantId(onlyTenantId);
			setTenantIdOption(onlyTenant);
		} else {
			setTenantId(0);
			setTenantIdOption(undefined);
		}

		setDefaultRoletId(0);
		setDefaultRoleIdOption(undefined);
		setLogo('');
		setBackground('');
		setMaxActiveVideos(0);
		setLocked(true);
		setChatEnabled(true);
		setRaiseHandEnabled(true);
		setReactionsEnabled(true);
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

	const handleTenantIdChange = (event: SyntheticEvent<Element, Event>, newValue: Tenant) => {
		if (newValue) {
			if (typeof newValue.id != 'number') {
				setTenantId(parseInt(newValue.id as unknown as string));
			} else {
				setTenantId(newValue.id);
			}
			setTenantIdOption(newValue);
		}
	};

	const handleDefaultRoleIdChange = (event: SyntheticEvent<Element, Event>, newValue: Roles) => {
		if (newValue) {
			if (typeof newValue.id != 'number') {
				setDefaultRoletId(parseInt(newValue.id));
			} else {
				setDefaultRoletId(newValue.id);
			}
			setDefaultRoleIdOption(newValue);
		}
	};

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
	const handleReactionsEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setReactionsEnabled(event.target.checked);
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
		if (id != 0 && confirm('Are you sure?')) {
			dispatch(deleteData(id, 'rooms')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (name != '' && id == 0) {
			dispatch(createRoomWithParams({ 
				tenantId: tenantId,
				name: name,
				description: description,
				logo: logo,
				background: background,
				maxActiveVideos: maxActiveVideos,
				locked: locked,
				chatEnabled: chatEnabled,
				raiseHandEnabled: raiseHandEnabled,
				reactionsEnabled: reactionsEnabled,
				filesharingEnabled: filesharingEnabled,
				localRecordingEnabled: localRecordingEnabled,
				breakoutsEnabled: breakoutsEnabled
			})).then(() => {
				fetchProduct();
				setOpen(false);
			});

		} else if (name != '' && id != 0) {
			const obj : Room= {
				tenantId: tenantId,
				description: description,
				logo: logo,
				background: background,
				maxActiveVideos: maxActiveVideos,
				locked: locked,
				chatEnabled: chatEnabled,
				raiseHandEnabled: raiseHandEnabled,
				reactionsEnabled: reactionsEnabled,
				filesharingEnabled: filesharingEnabled,
				localRecordingEnabled: localRecordingEnabled,
				breakoutsEnabled: breakoutsEnabled,
			};
			
			if (defaultRoleId) {
				obj.defaultRoleId=defaultRoleId;
			}
			dispatch(patchData(id, obj, 'rooms')).then(() => {
				fetchProduct();
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
			<Dialog open={open} onClose={handleClose}>
				<DialogTitle>{manageItemLabel()}</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{genericItemDescLabel()}
					</DialogContentText>
					<input type="hidden" name="id" value={id} />
					{tenants.length > 1 && (
						<Autocomplete
							options={tenants}
							getOptionLabel={(option) => option.name}
							fullWidth
							disableClearable
							onChange={handleTenantIdChange}
							value={tenantIdOption}
							readOnly={id !== 0} // tenant not changeable on edit
							sx={{ marginTop: '8px' }}
							renderInput={(params) => <TextField {...params} label={tenantLabel()} />}
						/>
					)}
					<TextField
						autoFocus
						margin="dense"
						id="name"
						label={nameLabel()}
						type="text"
						required
						fullWidth
						onChange={handleNameChange}
						value={name}
						disabled={nameDisabled}
					/>
					<TextField
						margin="dense"
						id="description"
						label={descLabel()}
						type="text"
						required
						fullWidth
						onChange={handleDescriptionChange}
						value={description}
					/>
					<Autocomplete
						options={roles}
						getOptionLabel={(option) => option.name}
						fullWidth
						disableClearable
						onChange={handleDefaultRoleIdChange}
						value={defaultRoleIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label={defaultRoleLabel()} />}
					/>
					<TextField
						margin="dense"
						id="logo"
						label={logoLabel()}
						type="text"
						required
						fullWidth
						onChange={handleLogoChange}
						value={logo}
					/>
					<TextField
						margin="dense"
						id="background"
						label={roomBgLabel()}
						type="text"
						required
						fullWidth
						onChange={handleBackgroundChange}
						value={background}
					/>
					<TextField
						margin="dense"
						id="maxActiveVideos"
						label={maxActiveVideosLabel()}
						type="number"
						required
						fullWidth
						onChange={handleMaxActiveVideosChange}
						value={maxActiveVideos}
					/>
					<FormControlLabel control={<Checkbox checked={locked} onChange={handleLockedChange} />} label={lockRoomLabel()} />
					<FormControlLabel control={<Checkbox checked={chatEnabled} onChange={handleChatEnabledChange} />} label={chatEnabledLabel()} />
					<FormControlLabel control={<Checkbox checked={raiseHandEnabled} onChange={handleRaiseHandEnabledChange} />} label={raiseHandEnabledLabel()} />
					<FormControlLabel control={<Checkbox checked={reactionsEnabled} onChange={handleReactionsEnabledChange} />} label={reactionsEnabledLabel()} />
					<FormControlLabel control={<Checkbox checked={filesharingEnabled} onChange={handleFilesharingEnabledChange} />} label={filesharingEnabledLabel()} />
					<FormControlLabel control={<Checkbox checked={localRecordingEnabled} onChange={handleLocalRecordingEnabledChange} />} label={localRecordingEnabledLabel()} />
					<FormControlLabel control={<Checkbox checked={breakoutsEnabled} onChange={handleBreakoutsEnabledChange} />} label={breakoutsEnabledLabel()} />
					
					{ id !=0 && <>
						<RoomOwnerTable roomId={id} />
						<RoomUserRoleTable roomId={id} />
					</>}
					
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
					const treactionsEnabled=r[14].getValue();
					const tfilesharingEnabled=r[15].getValue();
					const tlocalRecordingEnabled=r[16].getValue();
					
					const tbreakoutsEnabled=r[19].getValue();

					if (typeof tid === 'number') {
						setId(tid);
					} else if (typeof tid == 'string') {
						setId(parseInt(tid));
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
						const tdefaultrole = roles.find((x) => x.id == parseInt(tdefaultroleId));

						if (tdefaultrole) {
							setDefaultRoleIdOption(tdefaultrole);
						} else {
							setDefaultRoleIdOption(undefined);
						}
						setDefaultRoletId(parseInt(tdefaultroleId));
					} else if (typeof tdefaultroleId === 'number') {
						const tdefaultrole = roles.find((x) => x.id == tdefaultroleId);

						if (tdefaultrole) {
							setDefaultRoleIdOption(tdefaultrole);
						} else {
							setDefaultRoleIdOption(undefined);
						}
						setDefaultRoletId(tdefaultroleId);
					} else {
						setDefaultRoletId(0);
						setDefaultRoleIdOption(undefined);
					}
					if (typeof ttenantId === 'string') {

						const parsedTenantId = parseInt(ttenantId);
						const ttenant = tenants.find((x) => x.id === parsedTenantId);

						if (ttenant) {
							setTenantIdOption(ttenant);
						}
						setTenantId(parsedTenantId);
					} else if (typeof ttenantId === 'number') {
						const ttenant = tenants.find((x) => x.id === ttenantId);

						if (ttenant) {
							setTenantIdOption(ttenant);
						}
						setTenantId(ttenantId);
					} else {
						setTenantId(0);
						setTenantIdOption(undefined);
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
					if (treactionsEnabled === true) {
						setReactionsEnabled(true);
					} else {
						setReactionsEnabled(false);
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
					reactionsEnabled: false,
				}
			}}
			state={{ isLoading }}
		/>
	</>;
};

export default RoomTable;

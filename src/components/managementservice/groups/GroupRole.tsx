/* eslint-disable camelcase */
import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Autocomplete } from '@mui/material';
import { GroupRoles, Groups, Roles, Room } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import { addNewLabel, applyLabel, cancelLabel, deleteLabel, genericItemDescLabel, groupLabel, manageItemLabel, roleLabel, roomLabel, undefinedLabel } from '../../translated/translatedComponents';

const GroupRoleTable = () => {
	const dispatch = useAppDispatch();
	
	type RoomOptionTypes = Array<Room>

	// nested data is ok, see accessorKeys in ColumnDef below
	const [ rooms, setRooms ] = useState<RoomOptionTypes>([ {
		'id': 1,
		'name': '',
		'description': '',
		'createdAt': '',
		'updatedAt': '',
		'creatorId': '',
		'defaultRoleId': '',
		'tenantId': 1,
		'logo': null,
		'background': null,
		'maxActiveVideos': 0,
		'locked': true,
		'chatEnabled': true,
		'raiseHandEnabled': true,
		'filesharingEnabled': true,
		'groupRoles': [],
		'localRecordingEnabled': true,
		'owners': [],
		'breakoutsEnabled': true,
	}
	]);
	
	type RolesOptionTypes = Array<Roles>

	// nested data is ok, see accessorKeys in ColumnDef below
	const [ roles, setRoles ] = useState<RolesOptionTypes>([ {
		'id': 0,
		'name': '',   
		'description': '',
		'tenantId': 0,
		'permissions': []
	}
	]);

	const getRoleName = (id: string): string => {
		const t = roles.find((type) => type.id == parseInt(id));
	
		if (t && t.name) {
			return t.name;
		} else {
			return `${undefinedLabel()} ${roleLabel()}`;
		}
	};

	type GroupsOptionTypes = Array<Groups>

	// nested data is ok, see accessorKeys in ColumnDef below
	const [ groups, setGroups ] = useState<GroupsOptionTypes>([ {
		'id': 0,
		'name': '',   
		'description': '',
		'tenantId': 0
	}
	]);

	const getGroupsName = (id: string): string => {
		const t = groups.find((type) => type.id == parseInt(id));
	
		if (t && t.name) {
			return t.name;
		} else {
			return `${undefinedLabel()} ${groupLabel()}`;
		}
	};

	const getRoomName = (id: string): string => {
		const t = rooms.find((type) => type.id == parseInt(id));
	
		if (t && t.name) {
			return t.name;
		} else {
			return `${undefinedLabel()} ${roomLabel()}`;
		}
	};
	
	// should be memoized or stable
	const columns = useMemo<MRT_ColumnDef<GroupRoles>[]>(
		() => [
			{
				accessorKey: 'id',
				header: '#'
			},
			{
				accessorKey: 'groupId',
				header: groupLabel(),
				Cell: ({ cell }) => getGroupsName(cell.getValue<string>())

			},
			{
				accessorKey: 'roleId',
				header: roleLabel(),
				Cell: ({ cell }) => getRoleName(cell.getValue<string>())

			},
			{
				accessorKey: 'roomId',
				header: roomLabel(),
				Cell: ({ cell }) => getRoomName(cell.getValue<string>())

			},

			/* {
				accessorKey: 'role',
				header: 'role',
				Cell: ({ cell }) =>
					(	
						cell.getValue<Roles>().name
					),
			}, */
		],
		[ rooms, roles, groups ],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ groupId, setGroupId ] = useState(0);
	const [ roleId, setRoleId ] = useState(0);
	const [ roomId, setRoomId ] = useState(0);

	const [ groupIdOption, setGroupIdOption ] = useState<Groups | undefined>();
	const [ roleIdOption, setRoleIdOption ] = useState<Roles | undefined>();
	const [ roomIdOption, setRoomIdOption ] = useState<Room | undefined>();
	const [ groupIdOptionDisabled, setGroupIdOptionDisabled ] = useState(true);
	const [ roleIdOptionDisabled, setRoleIdOptionDisabled ] = useState(true);
	const [ roomIdOptionDisabled, setRoomIdOptionDisabled ] = useState(true);

	const [ cantPatch, setCantPatch ] = useState(true);
	const [ cantDelete ] = useState(false);

	async function fetchProduct() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('groups')).then((tdata: any) => {
			if (tdata != undefined) {
				setGroups(tdata.data);
			}
		});
		
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('rooms')).then((tdata: any) => {
			if (tdata != undefined) {
				setRooms(tdata.data);
			}
           
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('roles')).then((tdata: any) => {
			if (tdata != undefined) {
				setRoles(tdata.data);
			}
           
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('roomGroupRoles')).then((tdata: any) => {
			if (tdata != undefined) {
				setData(tdata);
			}
			setIsLoading(false);
        
		});

	}

	useEffect(() => {
		// By moving this function inside the effect, we can clearly see the values it uses.
		setIsLoading(true);
		fetchProduct();
	}, []);

	const [ open, setOpen ] = useState(false);

	const handleClickOpen = () => {
		setId(0);
		setGroupId(0);
		setRoleId(0);
		setRoomId(0);
		setGroupIdOption(undefined);
		setRoleIdOption(undefined);
		setRoomIdOption(undefined);
		setGroupIdOptionDisabled(false);
		setRoleIdOptionDisabled(false);
		setRoomIdOptionDisabled(false);
		setCantPatch(false);
		setOpen(true);
	};

	const handleClickOpenNoreset = () => {
		setGroupIdOptionDisabled(true);
		setRoleIdOptionDisabled(true);
		setRoomIdOptionDisabled(true);
		setCantPatch(true);
		setOpen(true);
	};

	const handleGroupIdChange = (event: SyntheticEvent<Element, Event>, newValue: Groups) => {
		if (newValue) {
			if (typeof newValue.id != 'number') {
				setGroupId(parseInt(newValue.id));
			} else {
				setGroupId(newValue.id);
			}
			setGroupIdOption(newValue);
		}
	};
	const handleRoleIdChange = (event: SyntheticEvent<Element, Event>, newValue: Roles) => {
		if (newValue) {
			if (typeof newValue.id != 'number') {
				setRoleId(parseInt(newValue.id));
			} else {
				setRoleId(newValue.id);
			}
			setRoleIdOption(newValue);
		}
	};
	const handleRoomIdChange = (event: SyntheticEvent<Element, Event>, newValue: Room) => {
		if (newValue && newValue.id) {
			if (typeof newValue.id != 'number') {
				setRoomId(parseInt(newValue.id));
			} else {
				setRoomId(newValue.id);
			}
			setRoomIdOption(newValue);
		}
	};

	const handleClose = () => {
		setOpen(false);
	};

	const delTenant = async () => {

		// add new data / mod data / error
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			dispatch(deleteData(id, 'roomGroupRoles')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (id === 0) {
			dispatch(createData({ 
				groupId: groupId,
				roleId: roleId,
				roomId: roomId
			}, 'roomGroupRoles')).then(() => {
				fetchProduct();
				setOpen(false);
			});
			
		} else if (id != 0) {
			dispatch(patchData(id, { 
				groupId: groupId,
				roleId: roleId,
				roomId: roomId
			}, 'roomGroupRoles')).then(() => {
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
					<Autocomplete
						options={groups}
						getOptionLabel={(option) => option.name}
						fullWidth
						disableClearable
						readOnly={groupIdOptionDisabled}
						onChange={handleGroupIdChange}
						value={groupIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label={groupLabel()} />}
					/>
					<Autocomplete
						options={roles}
						getOptionLabel={(option) => option.name}
						fullWidth
						disableClearable
						readOnly={roleIdOptionDisabled}
						onChange={handleRoleIdChange}
						value={roleIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label={roleLabel()} />}
					/>
					<Autocomplete
						options={rooms}
						getOptionLabel={(option) => ((typeof option.name == 'string')?option.name:'')}
						fullWidth
						disableClearable
						readOnly={roomIdOptionDisabled}
						onChange={handleRoomIdChange}
						value={roomIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label={roomLabel()} />}
					/>
					
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
					const tgroupId=r[1].getValue();
					const troleId=r[2].getValue();
					const troomId=r[3].getValue();

					if (typeof tid === 'number') {
						setId(tid);
					} else if (typeof tid == 'string') {
						setId(parseInt(tid));
					}

					if (typeof tgroupId === 'number') {
						const tgroup = groups.find((x) => x.id == tgroupId);

						if (tgroup) {
							setGroupIdOption(tgroup);
						}
						setGroupId(tgroupId);
					} else if (typeof tgroupId === 'string') {
						const tgroup = groups.find((x) => x.id == parseInt(tgroupId));

						if (tgroup) {
							setGroupIdOption(tgroup);
						}
						setGroupId(parseInt(tgroupId));
					} else {
						setGroupId(0);
						setGroupIdOption(undefined);
					}

					if (typeof troleId === 'number') {
						const troles = roles.find((x) => x.id == troleId);

						if (troles) {
							setRoleIdOption(troles);
						}
						setRoleId(troleId);
					} else if (typeof troleId === 'string') {
						const troles = roles.find((x) => x.id == parseInt(troleId));

						if (troles) {
							setRoleIdOption(troles);
						}
						setRoleId(parseInt(troleId));
					} else {
						setRoleId(0);
						setRoleIdOption(undefined);
					}
					if (typeof troomId === 'number') {
						const troom = rooms.find((x) => x.id == troomId);

						if (troom) {
							setRoomIdOption(troom);
						}
						setRoomId(troomId);
					} else if (typeof troomId === 'string') {
						const troom = rooms.find((x) => x.id == parseInt(troomId));

						if (troom) {
							setRoomIdOption(troom);
						}
						setRoomId(parseInt(troomId));
					} else {
						setRoomId(0);
						setRoomIdOption(undefined);
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

export default GroupRoleTable;

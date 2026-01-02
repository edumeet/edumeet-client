import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Autocomplete } from '@mui/material';
import { Roles, Room, User, UsersRoles } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData, getDataByRoomId, patchData } from '../../../store/actions/managementActions';
import { RoomProp } from './Room';
import { userLabel } from '../../translated/translatedComponents';

const RoomUserRoleTable = (props: RoomProp) => {
	const roomId = props.roomId;
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
		'reactionsEnabled': true,
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
		const t = roles.find((type) => type.id === parseInt(id));
	
		if (t && t.name) {
			return t.name;
		} else {
			return 'undefined role';
		}
	};

	type UsersOptionTypes = Array<User>

	// nested data is ok, see accessorKeys in ColumnDef below
	const [ users, setUsers ] = useState<UsersOptionTypes>([ {
		'id': 0,
		'ssoId': '',
		'tenantId': 0,
		'email': '',
		'name': '',
		'avatar': '',
		'roles': [],
		'tenantAdmin': false,
		'tenantOwner': false
	}
	]);

	const getUserName = (id: string): string => {
		const t = users.find((type) => type.id === parseInt(id));
	
		if (t && t.email) {
			return t.email;
		} else {
			return 'undefined user';
		}
	};

	// nested data is ok, see accessorKeys in ColumnDef below
	
	const getRoomName = (id: string): string => {
		const t = rooms.find((type) => type.id === parseInt(id));
	
		if (t && t.name) {
			return t.name;
		} else {
			return 'undefined room';
		}
	};

	// should be memoized or stable
	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<UsersRoles>[]>(
		() => [
			{
				accessorKey: 'id',
				header: '#'
			},
			{
				accessorKey: 'userId',
				header: userLabel(),
				Cell: ({ cell }) => getUserName(cell.getValue<string>())

			},
			{
				accessorKey: 'roleId',
				header: 'Role',
				Cell: ({ cell }) => getRoleName(cell.getValue<string>())

			},
			{
				accessorKey: 'roomId',
				header: 'Room',
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
		[ rooms, roles, users ],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ userId, setUserId ] = useState(0);
	const [ roleId, setRoleId ] = useState(0);

	/* const [ roomId, setRoomId ] = useState(0); */

	const [ cantPatch, setCantPatch ] = useState(true);
	const [ cantDelete ] = useState(false);
	const [ userIdOption, setUserIdOption ] = useState<User | undefined>();
	const [ roleIdOption, setRoleIdOption ] = useState<Roles | undefined>();

	/* const [ roomIdOption, setRoomIdOption ] = useState<Room | undefined>(); */
	const [ userIdOptionDisabled, setUserIdOptionDisabled ] = useState(true);
	const [ roleIdOptionDisabled, setRoleIdOptionDisabled ] = useState(true);

	/* const [ roomIdOptionDisabled, setRoomIdOptionDisabled ] = useState(true); */

	async function fetchProduct() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('users')).then((tdata: any) => {
			if (tdata != undefined) {
				setUsers(tdata.data);
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
		dispatch(getDataByRoomId(roomId, 'roomUserRoles')).then((tdata: any) => {
			
			if (tdata != undefined) {
				setData(tdata.data ?? tdata);
			}
			setIsLoading(false);
        
		});

	}

	useEffect(() => {
		// By moving this function inside the effect, we can clearly see the values it uses.
		setIsLoading(true);
		fetchProduct();
	}, [ roomId ]);

	const [ open, setOpen ] = useState(false);

	const handleClickOpen = () => {
		setId(0);
		setUserId(0);
		setRoleId(0);

		/* setRoomId(0); */
		setUserIdOption(undefined);
		setRoleIdOption(undefined);

		/* setRoomIdOption(undefined); */
		setUserIdOptionDisabled(false);
		setRoleIdOptionDisabled(false);

		/* setRoomIdOptionDisabled(false); */
		setCantPatch(false);
		setOpen(true);
	};

	const handleClickOpenNoreset = () => {
		setCantPatch(true);
		setUserIdOptionDisabled(true);
		setRoleIdOptionDisabled(true);

		/* setRoomIdOptionDisabled(true); */
		setOpen(true);
	};

	const handleUserIdChange = (event: SyntheticEvent<Element, Event>, newValue: User) => {
		if (newValue) {
			if (typeof newValue.id != 'number') {
				setUserId(parseInt(newValue.id));
			} else {
				setUserId(newValue.id);
			}
			setUserIdOption(newValue);
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

	/* const handleRoomIdChange = (event: SyntheticEvent<Element, Event>, newValue: Room) => {
		if (newValue && typeof newValue.id === 'number') {
			setRoomId(newValue.id);
			setRoomIdOption(newValue);
		}
	}; */

	const handleClose = () => {
		setOpen(false);
	};

	const delTenant = async () => {

		// add new data / mod data / error
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			dispatch(deleteData(id, 'roomUserRoles')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (id === 0) {
			dispatch(createData({ 
				userId: userId,
				roleId: roleId,
				roomId: roomId
			}, 'roomUserRoles')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		} else if (id != 0) {
			dispatch(patchData(id, { 
				userId: userId,
				roleId: roleId,
				roomId: roomId
			}, 'roomUserRoles')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}

	};

	const getUserLabel = (u: User): string => {
		if (u?.email) return `${u.id} - ${u.email}`;

		return String(u?.id ?? '');
	};

	return <>
		<div>
			<h4>Room-User roles</h4>
			<Button variant="outlined" onClick={() => handleClickOpen()}>
				Add new
			</Button>
			<hr/>
			<Dialog open={open} onClose={handleClose}>
				<DialogTitle>Add/Edit</DialogTitle>
				<DialogContent>
					<DialogContentText>
						These are the parameters that you can change.
					</DialogContentText>
					<input type="hidden" name="id" value={id} />
					<Autocomplete
						options={users}
						getOptionLabel={(option) => getUserLabel(option)}
						fullWidth
						disableClearable
						readOnly={userIdOptionDisabled}
						onChange={handleUserIdChange}
						value={userIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label="User" />}
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
						renderInput={(params) => <TextField {...params} label="Role" />}
					/>
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
					const tuserId=r[1].getValue();
					const troleId=r[2].getValue();

					/* const troomId=r[3].getValue(); */

					if (typeof tid === 'number') {
						setId(tid);
					} else if (typeof tid == 'string') {
						setId(parseInt(tid));
					}

					if (typeof tuserId === 'number') {
						const tuser = users.find((x) => x.id == tuserId);

						if (tuser) {
							setUserIdOption(tuser);
						}
						setUserId(tuserId);
					} else if (typeof tuserId === 'string') {
						const tuser = users.find((x) => x.id == parseInt(tuserId));

						if (tuser) {
							setUserIdOption(tuser);
						}
						setUserId(parseInt(tuserId));
					} else {
						setUserId(0);
						setUserIdOption(undefined);
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

export default RoomUserRoleTable;

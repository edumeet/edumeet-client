import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Autocomplete } from '@mui/material';
import React from 'react';
import { Room, RoomOwners, User } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';

const RoomOwnerTable = () => {
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
	const columns = useMemo<MRT_ColumnDef<RoomOwners>[]>(
		() => [

			{
				accessorKey: 'id',
				header: '#'
			},
			{
				accessorKey: 'roomId',
				header: 'Room',
				Cell: ({ cell }) => getRoomName(cell.getValue<string>())

			},
			{
				accessorKey: 'userId',
				header: 'User',
				Cell: ({ cell }) => getUserName(cell.getValue<string>())

			},
			
		],
		[ rooms, users ],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ cantPatch, setcantPatch ] = useState(false);
	const [ userIdOption, setUserIdOption ] = useState<User | undefined>();
	const [ roomIdOption, setRoomIdOption ] = useState<Room | undefined>();
	const [ userIdOptionDisabled, setUserIdOptionDisabled ] = useState(true);
	const [ roomIdOptionDisabled, setRoomIdOptionDisabled ] = useState(true);
	
	const [ roomId, setRoomId ] = useState(0);
	const [ userId, setUserId ] = useState(0);

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
		dispatch(getData('roomOwners')).then((tdata: any) => {
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

	const handleClickOpen = () => {
		setId(0);
		setRoomId(0);
		setUserId(0);
		setUserIdOption(undefined);
		setRoomIdOption(undefined);
		setUserIdOptionDisabled(false);
		setRoomIdOptionDisabled(false);
		setcantPatch(false);
		setOpen(true);
	};

	const handleClickOpenNoreset = () => {
		setUserIdOptionDisabled(true);
		setRoomIdOptionDisabled(true);
		setcantPatch(true);
		setOpen(true);
	};

	const handleUserIdChange = (event: SyntheticEvent<Element, Event>, newValue: User) => {
		if (newValue) {
			setUserId(newValue.id);
			setUserIdOption(newValue);
		}
	};
	const handleRoomIdChange = (event: SyntheticEvent<Element, Event>, newValue: Room) => {
		if (newValue && typeof newValue.id === 'number') {
			setRoomId(newValue.id);
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(deleteData(id, 'roomOwners')).then((tdata: any) => {
				// eslint-disable-next-line no-console
				console.log('User data', tdata);
				fetchProduct();
				setOpen(false);
			});
		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (id === 0) {
			dispatch(createData({ 
				roomId: roomId,
				userId: userId
			}, 'roomOwners')).then(() => {
				fetchProduct();
				setOpen(false);
   
			});
		} else if (id != 0) {
			dispatch(patchData(id, { 
				roomId: roomId,
				userId: userId
			}, 'roomOwners')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}

	};

	return <>
		<div>
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
						options={rooms}
						getOptionLabel={(option) => ((typeof option.name == 'string')?option.name:'')}
						fullWidth
						disableClearable
						readOnly={roomIdOptionDisabled}
						onChange={handleRoomIdChange}
						value={roomIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label="Room" />}
					/>
					<Autocomplete
						options={users}
						getOptionLabel={(option) => option.email}
						fullWidth
						disableClearable
						readOnly={userIdOptionDisabled}
						onChange={handleUserIdChange}
						value={userIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label="User" />}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={delTenant} color='warning'>Delete</Button>
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
					const troomId=r[1].getValue();
					const tuserId=r[2].getValue();
					
					if (typeof tid === 'number') {
						setId(tid);
					}
					if (typeof tuserId === 'string') {
						const tuser = users.find((x) => x.id === parseInt(tuserId));

						if (tuser) {
							setUserIdOption(tuser);
						}
						setUserId(parseInt(tuserId));
					} else {
						setUserId(0);
						setUserIdOption(undefined);
					}
					
					if (typeof troomId === 'string') {
						const troom = rooms.find((x) => x.id === parseInt(troomId));

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

export default RoomOwnerTable;

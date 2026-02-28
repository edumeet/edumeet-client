import { SyntheticEvent, useEffect, useMemo, useState, ChangeEvent } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Autocomplete, Box } from '@mui/material';
import { Room, RoomOwners, User } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData, getDataByRoomId, patchData, getUserByEmail } from '../../../store/actions/managementActions';
import { RoomProp } from './Room';
import { userLabel } from '../../translated/translatedComponents';

const RoomOwnerTable = (props: RoomProp) => {
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
		const t = users.find((type) => type.id == parseInt(id));
	
		if (t && t.email) {
			return t.email;
		} else {
			return 'Hidden email';
		}
	};

	// nested data is ok, see accessorKeys in ColumnDef below
	
	const getRoomName = (id: string): string => {
		const t = rooms.find((type) => type.id == parseInt(id));
	
		if (t && t.name) {
			return t.name;
		} else {
			return 'Undefined room';
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
				header: userLabel(),
				Cell: ({ cell }) => getUserName(cell.getValue<string>())

			},
			
		],
		[ rooms, users ],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ cantPatch, setcantPatch ] = useState(true);
	const [ userIdOptionDisabled, setUserIdOptionDisabled ] = useState(true);

	/* const [ roomIdOptionDisabled, setRoomIdOptionDisabled ] = useState(true); */
	/* const [ roomIdOption, setRoomIdOption ] = useState<Room | undefined>(); */
	
	const [ userId, setUserId ] = useState(0);

	const [ userEmailInput, setUserEmailInput ] = useState('');
	const [ isResolvingUser, setIsResolvingUser ] = useState(false);
	const [ userResolveError, setUserResolveError ] = useState<string | null>(null);

	const [ selectedUser, setSelectedUser ] = useState<User | null>(null);

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
		dispatch(getDataByRoomId(roomId, 'roomOwners')).then((tdata: any) => {
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

	const [ open, setOpen ] = useState(false);

	const handleClickOpen = () => {
		setId(0);

		/* setRoomId(0); */
		setUserId(0);
		setSelectedUser(null);

		setUserEmailInput('');
		setUserResolveError(null);

		/* setRoomIdOption(undefined); */
		setUserIdOptionDisabled(false);

		/* setRoomIdOptionDisabled(false); */
		setcantPatch(false);
		setOpen(true);
	};

	const handleClickOpenNoreset = () => {
		setUserIdOptionDisabled(true);

		setUserEmailInput('');
		setUserResolveError(null);

		/* setRoomIdOptionDisabled(true); */
		setcantPatch(true);
		setOpen(true);
	};

	const handleUserIdChange = (event: SyntheticEvent<Element, Event>, newValue: User) => {
		if (newValue) {
			if (typeof newValue.id != 'number') {
				setUserId(parseInt(newValue.id));
			} else {
				setUserId(newValue.id);
			}
			setSelectedUser(newValue);
		}
	};

	const handleUserEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
		setUserEmailInput(event.target.value);
		setUserResolveError(null);
	};

	const getUserNumericId = (u: User): number => {
		return typeof u.id === 'number' ? u.id : parseInt(String(u.id), 10);
	};

	const handleResolveUserByEmail = () => {
		const email = userEmailInput.trim();

		if (!email) return;

		setIsResolvingUser(true);
		setUserResolveError(null);

		dispatch(getUserByEmail(email))
			.then((tdata: unknown) => {
				setIsResolvingUser(false);

				let list: Array<{ id: string | number }> = [];

				if (Array.isArray(tdata)) {
					list = tdata as Array<{ id: string | number }>;
				} else if (
					tdata &&
					typeof tdata === 'object' &&
					'data' in tdata
				) {
					const dataField = (tdata as { data?: unknown }).data;

					if (Array.isArray(dataField)) {
						list = dataField as Array<{ id: string | number }>;
					}
				}

				if (list.length === 0) {
					setUserId(0);
					setSelectedUser(null);
					setUserResolveError('No user found with this email.');

					return;
				}

				const first = list[0];
				const idNumber =
					typeof first.id === 'number'
						? first.id
						: parseInt(String(first.id), 10);

				const existing = users.find(
					(u) => getUserNumericId(u) === idNumber
				);

				if (!existing) {
					setUserId(0);
					setSelectedUser(null);
					setUserResolveError('User found but not available in list.');

					return;
				}

				// update email in users list
				setUsers((prev) => {
					return prev.map((u) => {
						if (getUserNumericId(u) === idNumber) {
							return {
								...u,
								email,
							};
						}

						return u;
					});
				});

				const updatedUser: User = { ...existing, email };

				setUserId(idNumber);
				setSelectedUser(updatedUser);
				setCantPatch(false);
			})
			.catch(() => {
				setIsResolvingUser(false);
				setUserResolveError('Error resolving user.');
			});
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
			dispatch(deleteData(id, 'roomOwners')).then(() => {
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

	const getUserLabel = (u: User): string => {
		if (u?.email) return `${u.id} - ${u.email}`;

		return `${u.id} - Hidden email`;
	};

	return <>
		<div>
			<h4>Room owners</h4>
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
					{/* <Autocomplete
						options={rooms}
						getOptionLabel={(option) => ((typeof option.name == 'string')?option.name:'')}
						fullWidth
						disableClearable
						readOnly={roomIdOptionDisabled}
						onChange={handleRoomIdChange}
						value={roomIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label="Room" />}
					/> */}
					<Box
						sx={{
							display: 'flex',
							alignItems: 'flex-start',
							marginTop: '8px',
						}}
					>
						<TextField
							label="User email"
							fullWidth
							sx={{ marginRight: '8px' }}
							value={userEmailInput}
							onChange={handleUserEmailChange}
							error={userResolveError !== null}
							helperText={userResolveError ?? ''}
							disabled={cantPatch}
						/>
						<Button
							variant="outlined"
							sx={{ alignSelf: 'flex-start' }}
							onClick={handleResolveUserByEmail}
							disabled={cantPatch || isResolvingUser || userEmailInput.trim() === ''}
						>
							{'SELECT'}
						</Button>
					</Box>
					<Autocomplete
						options={users}
						getOptionLabel={(option) => getUserLabel(option)}
						isOptionEqualToValue={(option, value) => {
							if (value === null || value === undefined) {
								return false;
							}

							const optionId = getUserNumericId(option);
							const valueId = getUserNumericId(value);

							return optionId === valueId;
						}}
						fullWidth
						disableClearable
						disabled={cantPatch}
						readOnly={userIdOptionDisabled}
						onChange={handleUserIdChange}
						value={selectedUser as User}
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

					/* const troomId=r[1].getValue(); */
					const tuserId=r[2].getValue();
					
					if (typeof tid === 'number') {
						setId(tid);
					} else if (typeof tid == 'string') {
						setId(parseInt(tid));
					}

					setUserId(numericUserId);

					const existingUser = users.find((u) => getUserNumericId(u) === numericUserId) || null;

					setSelectedUser(existingUser);

					
					/* 					if (typeof troomId === 'string') {
						const troom = rooms.find((x) => x.id === parseInt(troomId));

						if (troom) {
							setRoomIdOption(troom);
						}
						setRoomId(parseInt(troomId));
					} else {
						setRoomId(0);
						setRoomIdOption(undefined);
					} */

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

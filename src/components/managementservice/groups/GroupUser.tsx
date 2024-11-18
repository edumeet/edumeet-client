import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Autocomplete } from '@mui/material';
import { Groups, GroupUsers, User } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';

const GroupUserTable = () => {
	const dispatch = useAppDispatch();

	type GroupsTypes = Array<Groups>
	type UserTypes = Array<User>

	const [ groups, setGroups ] = useState<GroupsTypes>([ {
		id: 0,
		name: 'string',   
		description: 'string',
		tenantId: 0 
	} ]);

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

	const getGroupName = (id: string): string => {
		const t = groups.find((type) => type.id === parseInt(id));

		if (t && t.name) {
			return t.name;
		} else {
			return 'undefined group';
		}
	};
	const getUserEmail = (id: string): string => {
		const t = users.find((type) => type.id === parseInt(id));

		if (t && t.email) {
			return t.email;
		} else {
			return 'no such email';
		}
	};

	// should be memoized or stable
	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<GroupUsers>[]>(
		() => [

			{
				accessorKey: 'id',
				header: '#'
			},
			{
				accessorKey: 'groupId',
				header: 'Group',
				Cell: ({ cell }) => getGroupName(cell.getValue<string>())
			},
			{
				accessorKey: 'userId',
				header: 'User',
				Cell: ({ cell }) => getUserEmail(cell.getValue<string>())

			}
		],
		[ groups, users ],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ groupId, setGroupId ] = useState(0);
	const [ cantPatch, setCantPatch ] = useState(false);
	const [ cantDelete ] = useState(false);
	const [ userId, setUserId ] = useState(0);
	const [ groupIdDisabled, setGroupIdDisabled ] = useState(false);
	const [ userIdDisabled, setUserIdDisabled ] = useState(false);

	const [ groupIdOption, setGroupIdOption ] = useState<Groups | undefined>();
	const [ userIdOption, setUserIdOption ] = useState<User | undefined>();
	
	async function fetchProduct() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('groups')).then((tdata: any) => {
			if (tdata != undefined) {
				setGroups(tdata.data);
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('users')).then((tdata: any) => {
			if (tdata != undefined) {
				setUsers(tdata.data);
			}
           
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('groupUsers')).then((tdata: any) => {
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
		setGroupIdDisabled(false);
		setUserId(0);
		setUserIdDisabled(false);
		setUserIdOption(undefined);
		setGroupIdOption(undefined);
		setCantPatch(false);
		setOpen(true);
	};

	const handleClickOpenNoreset = () => {
		setGroupIdDisabled(true);
		
		setUserIdDisabled(true);
		
		setCantPatch(true);
		setOpen(true);
	};

	const handleGroupIdChange = (event: SyntheticEvent<Element, Event>, newValue: Groups) => {
		if (newValue) {
			setGroupId(newValue.id);
			setGroupIdOption(newValue);
		}
	};

	const handleUserIdChange = (event: SyntheticEvent<Element, Event>, newValue: User) => {
		if (newValue) {
			setUserId(newValue.id);
			setUserIdOption(newValue);
		}
	};
	const handleClose = () => {
		setOpen(false);
	};

	const delTenant = async () => {

		// add new data / mod data / error
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			dispatch(deleteData(id, 'groupUsers')).then(() => {
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
				userId: userId
			}, 'groupUsers')).then(() => {
				fetchProduct();
				setOpen(false);
			});
			
		} else if (id != 0) {
			dispatch(patchData(id, { 
				groupId: groupId,
				userId: userId
			}, 'groupUsers')).then(() => {
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
					{/* 					<TextField
						autoFocus
						margin="dense"
						id="groupId"
						label="groupId"
						type="number"
						required
						fullWidth
						disabled={groupIdDisabled}
						onChange={handleGroupIdChange}
						value={groupId}
					/> */}
					<Autocomplete
						options={groups}
						getOptionLabel={(option) => option.name}
						fullWidth
						disableClearable
						readOnly={groupIdDisabled}
						onChange={handleGroupIdChange}
						value={groupIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label="Group" />}
					/>
					{/* 					<TextField
						autoFocus
						margin="dense"
						id="userId"
						label="userId"
						type="number"
						required
						fullWidth
						disabled={userIdDisabled}
						onChange={handleUserIdChange}
						value={userId}
					/> */}
					<Autocomplete
						options={users}
						getOptionLabel={(option) => option.email}
						fullWidth
						disableClearable
						readOnly={userIdDisabled}
						onChange={handleUserIdChange}
						value={userIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label="User" />}
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
					const tgroupId=r[1].getValue();
					const tuserId=r[2].getValue();

					if (typeof tid === 'number') {
						setId(tid);
					}

					if (typeof tgroupId === 'string') {
						const tgroup = groups.find((x) => x.id === parseInt(tgroupId));

						if (tgroup) {
							setGroupIdOption(tgroup);
						}
						setGroupId(parseInt(tgroupId));
					} else {
						setGroupId(0);
					}

					if (typeof tuserId === 'string') {
						const tuser = users.find((x) => x.id === parseInt(tuserId));

						if (tuser) {
							setUserIdOption(tuser);
						}
						setUserId(parseInt(tuserId));
					} else {
						setUserId(0);
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

export default GroupUserTable;

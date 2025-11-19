import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Autocomplete } from '@mui/material';
import { Tenant, TenantOptionTypes, TenantOwners, User } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import { addNewLabel, genericItemDescLabel, manageItemLabel, tenantAdminsLabel, tenantLabel, userLabel } from '../../translated/translatedComponents';
import { managamentActions } from '../../../store/slices/managementSlice';
import { getTenantName, getUserEmail } from '../../../utils/management';

const TenantAdminTable = () => {
	const dispatch = useAppDispatch();

	const tenants: TenantOptionTypes = useAppSelector((state) => state.management.tenants);

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
	
	// should be memoized or stable
	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<TenantOwners>[]>(
		() => [

			{
				accessorKey: 'id',
				header: '#'
			},
			{
				accessorKey: 'tenantId',
				header: tenantLabel(),
				Cell: ({ cell }) => getTenantName(tenants, cell.getValue<string>())

			},
			{
				accessorKey: 'userId',
				header: userLabel(),
				Cell: ({ cell }) => getUserEmail(users, cell.getValue<string>())

			},
		],
		[ tenants, users ],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ cantPatch, setcantPatch ] = useState(false);
	const [ tenantId, setTenantId ] = useState(0);
	const [ userId, setUserId ] = useState(0);
	const [ tenantIdOption, setTenantIdOption ] = useState<Tenant | undefined>();
	const [ userIdOption, setUserIdOption ] = useState<User | undefined>();
	const [ tenantIdOptionDisabled, settenantIdOptionDisabled ] = useState(false);
	const [ userIdOptionDisabled, setUserIdOptionDisabled ] = useState(false);

	async function fetchProduct() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('users')).then((tdata: any) => {
			if (tdata != undefined) {
				setUsers(tdata.data);
			}
           
		});
		// Find all users
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('tenants')).then((tdata: any) => {
			if (tdata != undefined) {
				dispatch(managamentActions.setTenants(tdata.data));
			}
                
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('tenantAdmins')).then((tdata: any) => {
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
		setTenantId(0);
		setUserId(0);
		setTenantIdOption(undefined);
		setUserIdOption(undefined);
		settenantIdOptionDisabled(false);
		setUserIdOptionDisabled(false);
		setcantPatch(false);
		setOpen(true);
	};

	const handleClickOpenNoreset = () => {
		settenantIdOptionDisabled(true);
		setUserIdOptionDisabled(true);
		setcantPatch(true);
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
	const handleClose = () => {
		setOpen(false);
	};

	const delTenant = async () => {

		// add new data / mod data / error
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(deleteData(id, 'tenantAdmins')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (id === 0) {
			dispatch(createData({ 
				tenantId: tenantId,
				userId: userId
			}, 'tenantAdmins')).then(() => {
				fetchProduct();
				setOpen(false);
   
			});
		} else if (id != 0) {
			dispatch(patchData(id, { 
				tenantId: tenantId,
				userId: userId
			}, 'tenantAdmins')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}

	};

	return <>
		<div>
			<h4>{tenantAdminsLabel()}</h4>
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
						options={users}
						getOptionLabel={(option) => option.email}
						fullWidth
						disableClearable
						readOnly={userIdOptionDisabled}
						onChange={handleUserIdChange}
						value={userIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label={userLabel()} />}
					/>
					<Autocomplete
						options={tenants}
						getOptionLabel={(option) => option.name}
						fullWidth
						disableClearable
						readOnly={tenantIdOptionDisabled}
						onChange={handleTenantIdChange}
						value={tenantIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label={tenantLabel()} />}
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
					const ttenantId=r[1].getValue();
					const tuserId=r[2].getValue();
					
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

export default TenantAdminTable;

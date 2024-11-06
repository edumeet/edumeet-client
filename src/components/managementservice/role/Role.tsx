import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Autocomplete, Snackbar, FormControlLabel, Checkbox, Box } from '@mui/material';
import React from 'react';
import MuiAlert, { AlertColor, AlertProps } from '@mui/material/Alert';
import { Roles, Tenant, Permissions, RolePermissions } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData, getTenants, patchData } from '../../../store/actions/managementActions';

const RoleTable = () => {
	const dispatch = useAppDispatch();

	const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
		props,
		ref,
	) {
		return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
	});

	type TenantOptionTypes = Array<Tenant>

	const [ tenants, setTenants ] = useState<TenantOptionTypes>([ { 'id': 0, 'name': '', 'description': '' } ]);

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
	// should be memoized or stable
	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<Roles>[]>(
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
				header: 'description'
			},
			{
				accessorKey: 'tenantId',
				header: 'Tenant',
				Cell: ({ cell }) => getTenantName(cell.getValue<string>())

			},
			{
				accessorKey: 'permissions',
				header: 'Permission(s)',
				Cell: ({ cell }) =>
					(
						cell.getValue<Array<Permissions>>().map((single: Permissions) => single.name)
							.join(', ')
					),
			},

		],
		[ tenants ],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ name, setName ] = useState('');
	const [ description, setDescription ] = useState('');
	const [ tenantId, setTenantId ] = useState(0);

	const [ cantPatch ] = useState(false);
	const [ cantDelete ] = useState(false);
	const [ tenantIdOption, setTenantIdOption ] = useState<Tenant | undefined>();

	async function fetchProduct() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getTenants()).then((tdata: any) => {
			if (tdata != undefined) {
				setTenants(tdata.data);
			}
			setIsLoading(false);

		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('roles')).then((tdata: any) => {
			// eslint-disable-next-line no-console
			console.log('Rooms data', tdata);
			if (tdata != undefined) {
				setData(tdata.data);
			}
			setIsLoading(false);
    
		});
	}

	useEffect(() => {

		async function getPermissions() {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(getData('permissions')).then((tdata: any) => {
			// eslint-disable-next-line no-console
				console.log('Rooms data', tdata);
				if (tdata != undefined) {
					setPermissions(tdata.data);
					setChecked(new Array(tdata.data.length).fill(true));

				}
				setIsLoading(false);
    
			});

		}
		getPermissions();

		// By moving this function inside the effect, we can clearly see the values it uses.
		setIsLoading(true);
		fetchProduct();
	}, []);

	const [ open, setOpen ] = React.useState(false);

	const handleClickOpen = () => {
		setId(0);
		setName('');
		setDescription('');
		setTenantId(0);
		setChecked(new Array(permissions.length).fill(false));

		setOpen(true);
	};

	const handleClickOpenNoreset = () => {
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
			setTenantId(newValue.id);
			setTenantIdOption(newValue);
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
			dispatch(deleteData(id, 'roles')).then((tdata: any) => {
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
			try {
				dispatch(createData({ 
					name: name,
					description: description,
					tenantId: tenantId
				}, 'roles')).then((tdata: unknown) => {
					// eslint-disable-next-line no-console
					console.log('User data', tdata);
					fetchProduct();
					setOpen(false);
					// TODO finish
					setAlertMessage('Successfull add!');
					setAlertSeverity('success');
					setAlertOpen(true);
		
				});
			} catch (error) {
				if (error instanceof Error) {
					setAlertMessage(error.toString());
					setAlertSeverity('error');
					setAlertOpen(true);
				}
			}
		} else if (name != '' && id != 0) {

			dispatch(patchData(id, { 
				name: name,
				description: description,
				tenantId: tenantId
			}, 'roles')).then((tdata: unknown) => {
				// eslint-disable-next-line no-console
				console.log('Room data', tdata);
				// TODO finish
				fetchProduct();
				setOpen(false);
				setAlertMessage('Successfull modify!');
				setAlertSeverity('success');
				setAlertOpen(true);

			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(getData('rolePermissions')).then((rp: any) => {

				checked.forEach(async (element, index) => {
					// eslint-disable-next-line no-console
					console.log(element, index, id);
	
					const c = rp.data.filter((x: RolePermissions) => x.permissionId == index+1);
	
					if ((c.length === 0) === element) {
						// eslint-disable-next-line no-console
						console.log('should update this');
	
						if (element) {

							dispatch(createData({ 
								roleId: id,
								permissionId: index+1
							}, 'rolePermissions')).then((tdata: unknown) => {
								// eslint-disable-next-line no-console
								console.log('User data', tdata);
								fetchProduct();
								setOpen(false);
								// TODO finish
								setAlertMessage('Successfull add!');
								setAlertSeverity('success');
								setAlertOpen(true);
					
							});
						} else {
							// remove role
							dispatch(deleteData(c[0].id, 'rolePermissions')).then((tdata: unknown) => {
								// eslint-disable-next-line no-console
								console.log('User data', tdata);
								fetchProduct();
								setOpen(false);
								setAlertMessage('Successfull delete!');
								setAlertSeverity('success');
								setAlertOpen(true);
							});
							
						}
	
					}

				});
				fetchProduct();
	
				setIsLoading(false);
    
			});

		}

	};

	const handleAlertClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
		if (reason === 'clickaway') {
			return;
		}

		setAlertOpen(false);
	};
	const [ permissions, setPermissions ] = React.useState(Array<Permissions>);

	const [ checked, setChecked ] = React.useState(new Array(0).fill(true));

	const handleChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
		setChecked(new Array(permissions.length).fill(event.target.checked));
	};

	const handleChangeMod = (event: React.ChangeEvent<HTMLInputElement>, i: number) => {
		setChecked(checked.map(function(currentelement, index) {
			if (index === i) { return event.target.checked; }

			return currentelement;
		}));
	};

	const children = (
		<Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
			{Object.entries(permissions).map(([ key, value ]) =>
				<FormControlLabel
					key={`${key}uniqe`}
					control={<Checkbox checked={checked[parseInt(key)]}
						onChange={(event) => handleChangeMod(event, parseInt(key))
						}
						name={`${key}uniq`} />}

					label={value.name}
				/>
			)}
		</Box>
	);

	return <>
		<div>
			<Button variant="outlined" onClick={() => handleClickOpen()}>
				Add new
			</Button>
			<hr />
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
					<Autocomplete
						options={tenants}
						getOptionLabel={(option) => option.name}
						fullWidth
						disableClearable
						id="combo-box-demo"
						onChange={handleTenantIdChange}
						value={tenantIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label="Tenant" />}
					/>
					<div>
						<FormControlLabel
							label="All permissions"
							control={
								<Checkbox
									checked={checked.every((num) => num === true)}
									indeterminate={checked.some((num) => num === true) && checked.some((num) => num === false)}
									onChange={handleChange1}
								/>
							}
						/>
						{children}
					</div>
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
				onClick: async () => {

					const r = row.getAllCells();

					const tid = r[0].getValue();
					const tname = r[1].getValue();
					const tdescription = r[2].getValue();
					const ttenantId = r[3].getValue();

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
					if (typeof ttenantId === 'string') {
						const ttenant = tenants.find((x) => x.id === parseInt(ttenantId));

						if (ttenant) {
							setTenantIdOption(ttenant);
						}
						setTenantId(parseInt(ttenantId));
					} else {
						setTenantId(0);
					}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					dispatch(getData('rolePermissions')).then((rp: any) => {
					
						const a = new Array(permissions.length).fill(false);

						rp.data.forEach((element: RolePermissions) => {
							a[element.permissionId-1] = true;
						});
				
						setChecked(a);
					});	
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

export default RoleTable;

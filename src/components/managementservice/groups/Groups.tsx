import Autocomplete from '@mui/material/Autocomplete';
import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Snackbar } from '@mui/material';
import React from 'react';
import MuiAlert, { AlertColor, AlertProps } from '@mui/material/Alert';
import { Groups, Tenant } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData, getTenants, patchData } from '../../../store/actions/managementActions';

const GroupTable = () => {
	const dispatch = useAppDispatch();

	const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
		props,
		ref,
	) {
		return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
	});

	type TenantOptionTypes = Array<Tenant>

	const [ tenants, setTenants ] = useState<TenantOptionTypes>([ { 'id': 0, 'name': '', 'description': '' } ]);

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
	const columns = useMemo<MRT_ColumnDef<Groups>[]>(
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
			}
		],
		[ tenants ],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ name, setName ] = useState('');
	const [ description, setDescription ] = useState('');
	const [ cantPatch ] = useState(false);
	const [ cantDelete ] = useState(false);
	const [ tenantId, setTenantId ] = useState(0);
	
	const [ alertOpen, setAlertOpen ] = React.useState(false);
	const [ alertMessage, setAlertMessage ] = React.useState('');
	const [ alertSeverity, setAlertSeverity ] = React.useState<AlertColor>('success');

	const handleAlertClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
		if (reason === 'clickaway') {
			return;
		}
  
		setAlertOpen(false);
	};

	const [ tenantIdOption, setTenantIdOption ] = useState<Tenant | undefined>();
	const [ descriptionDisabled, setDescriptionDisabled ] = useState(false);
	const [ tenantIdDisabled, setTenantIdDisabled ] = useState(false);

	async function fetchProduct() {
		
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
		dispatch(getData('groups')).then((tdata: any) => {
			// eslint-disable-next-line no-console
			console.log('Rooms data', tdata);
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
		setName('');
		setDescription('');
		setDescriptionDisabled(false);
		// try to get current tenantId
		// TODO
		setTenantId(0);
		setTenantIdOption(undefined);

		setTenantIdDisabled(true);
		setOpen(true);
	};
	
	const handleClickOpenNoreset = () => {
		setDescriptionDisabled(false);
		setTenantIdDisabled(false);
		// get tenantId from clicked element
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
			dispatch(deleteData(id, 'groups')).then((tdata: any) => {
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
			dispatch(createData({ 
				name: name,
			}, 'groups')).then((tdata: unknown) => {
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
			dispatch(patchData(id,
				{
					name: name,
					description: description,
					tenantId: tenantId
				}, 'groups')).then((tdata: unknown) => {
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
			setAlertMessage('Name cannot be empty!');
			setAlertSeverity('warning');
			setAlertOpen(true);
		}

	};
	
	return <>
		<div>
			
			<Button variant="outlined" onClick={() => handleOpen()}>
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
						disabled={descriptionDisabled}
						onChange={handleDescriptionChange}
						value={description}
					/>
					{/* <TextField
						autoFocus
						margin="dense"
						id="tenantId"
						label="tenantId"
						type="number"
						required
						fullWidth
						disabled={tenantIdDisabled}
						onChange={handleTenantIdChange}
						value={tenantId}
					/> */}
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
						renderInput={(params) => <TextField {...params} label="Tenant" />}
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

export default GroupTable;
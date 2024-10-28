import React from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Snackbar } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import MuiAlert, { AlertColor, AlertProps } from '@mui/material/Alert';
import { Tenant } from '../../../utils/types';

import { createTenant, deleteTenant, getTenants, modifyTenant } from '../../../store/actions/managementActions';
import { useAppDispatch } from '../../../store/hooks';

const TenantTable = () => {

	const dispatch = useAppDispatch();

	const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
		props,
		ref,
	) {
		return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
	});
	
	const [ alertOpen, setAlertOpen ] = React.useState(false);
	const [ alertMessage, setAlertMessage ] = React.useState('');
	const [ alertSeverity, setAlertSeverity ] = React.useState<AlertColor>('success');

	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<Tenant>[]>(
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
			}
		],
		[],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ name, setName ] = useState('');
	const [ description, setDescription ] = useState('');

	async function fetchProduct() {
		setIsLoading(true);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getTenants()).then((tdata: any) => {
			// eslint-disable-next-line no-console
			console.log('Tenant data', tdata);
			if (tdata != undefined) {
				setData(tdata.data);
			}
		});
		
		setIsLoading(false);

	}

	useEffect(() => {
		fetchProduct();
	}, []);

	const [ open, setOpen ] = React.useState(false);

	const handleClickOpen = () => {
		setId(0);
		setName('');
		setDescription('');
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

	const handleClose = () => {
		setOpen(false);
	};

	const delTenant = async () => {

		// add new data / mod data / error
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(deleteTenant(id)).then((tdata: any) => {
				// eslint-disable-next-line no-console
				console.log('Tenant data', tdata);
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

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(createTenant(name, description)).then((tdata: any) => {
				// eslint-disable-next-line no-console
				console.log('Tenant data', tdata);
				fetchProduct();
				setOpen(false);
				// TODO finish
				setAlertMessage('Successfull add! (please reload page)');
				setAlertSeverity('success');
				setAlertOpen(true);
	
			});

		} else if (name != '' && id != 0) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(modifyTenant(id, { name: name, description: description })).then((tdata: any) => {
				// eslint-disable-next-line no-console
				console.log('Tenant data', tdata);
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
						label="Name"
						type="text"
						required
						fullWidth
						onChange={handleNameChange}

						value={name}
					/>
					<TextField
						margin="dense"
						id="description"
						label="description"
						type="text"
						fullWidth
						onChange={handleDescriptionChange}

						value={description}
					/>

				</DialogContent>
				<DialogActions>
					<Button onClick={delTenant} color='warning'>Delete</Button>
					<Button onClick={handleClose}>Cancel</Button>
					<Button onClick={addTenant}>OK</Button>
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

					if (typeof tid === 'number') {
						setId(tid);
					}

					if (typeof tname === 'string') {
						setName(tname);
					}

					if (typeof tdescription === 'string') {
						setDescription(tdescription);
					} else {
						setDescription('');
					}

					handleClickOpenNoreset();

				}
			})}
			columns={columns}
			data={data} // fallback to array if data is undefined
			initialState={{
				columnVisibility: {}
			}}
			state={{ isLoading }} /></>;
};

export default TenantTable;

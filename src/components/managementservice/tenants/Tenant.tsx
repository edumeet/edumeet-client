import { useEffect, useMemo, useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions } from '@mui/material';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Tenant, TenantOptionTypes } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import TenantFQDNTable from './TenatnFQDN';
import TenantOAuthTable from './TenantOAuth';
import { addNewLabel, applyLabel, authenticationLabel, cancelLabel, deleteLabel, descLabel, fqdnLabel, genericItemDescLabel, manageItemLabel, nameLabel, tenantLabel } from '../../translated/translatedComponents';
import { managamentActions } from '../../../store/slices/managementSlice';
export interface TenantProp {
	tenantId: number;
}

const TenantTable = () => {

	const dispatch = useAppDispatch();
	const { superAdmin } = useAppSelector((state) => state.management);

	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<Tenant>[]>(
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
			}
		],
		[],
	);

	const tenants: TenantOptionTypes = useAppSelector((state) => state.management.tenants);
	
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ name, setName ] = useState('');
	const [ description, setDescription ] = useState('');

	async function fetchProduct() {
		setIsLoading(true);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('tenants')).then((tdata: any) => {
			if (tdata != undefined) {
				dispatch(managamentActions.setTenants(tdata.data));
			}
			setIsLoading(false);

		});
	}

	useEffect(() => {
		fetchProduct();
	}, []);

	const [ open, setOpen ] = useState(false);

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
			dispatch(deleteData(id, 'tenants')).then(() => {
				fetchProduct();
				setOpen(false);
			});

		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (name != '' && id === 0) {

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(createData({ name, description }, 'tenants')).then(() => {
				fetchProduct();
				setOpen(false);
			});

		} else if (name != '' && id != 0) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(patchData(id, { name: name, description: description }, 'tenants')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}

	};
	
	return <>
		<div>
			<Button variant="outlined" disabled={!superAdmin} onClick={() => handleClickOpen()}>
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
					{ id !=0 && <>
						{`${tenantLabel()} ${fqdnLabel()}`}
						<TenantFQDNTable tenantId={id} />
						{`${tenantLabel()} ${authenticationLabel()}`}
						<TenantOAuthTable tenantId={id} />
					</>}

				</DialogContent>
				<DialogActions>
					<Button onClick={delTenant} color='warning'>{deleteLabel()}</Button>
					<Button onClick={handleClose}>{cancelLabel()}</Button>
					<Button onClick={addTenant}>{applyLabel()}</Button>
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
					} else if (typeof tid == 'string') {
						setId(parseInt(tid));
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
			data={tenants} // fallback to array if data is undefined
			initialState={{
				columnVisibility: {}
			}}
			state={{ isLoading }} /></>;
};

export default TenantTable;

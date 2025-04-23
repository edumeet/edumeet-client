import { useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions } from '@mui/material';
import { Tenant, TenantFQDN } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData, getDataByTenantID, patchData } from '../../../store/actions/managementActions';
import { TenantProp } from './Tenant';

const TenantFQDNTable = (props: TenantProp) => {
	const tenantId = props.tenantId;
	const dispatch = useAppDispatch();

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

	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<TenantFQDN>[]>(
		() => [

			{
				accessorKey: 'id',
				header: '#'
			},
			{
				accessorKey: 'tenantId',
				header: 'Tenant',
				Cell: ({ cell }) => getTenantName(cell.getValue<string>())

			},
			{
				accessorKey: 'description',
				header: 'description'
			},
			{
				accessorKey: 'fqdn',
				header: 'Fully Qualified Domain Name (FQDN)'
			},
			
		],
		[ tenants ],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);

	const [ fqdn, setFQDN ] = useState('');

	const [ description, setDescription ] = useState('');

	async function fetchProduct() {
		setIsLoading(true);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('tenants')).then((tdata: any) => {
			if (tdata != undefined) {
				setTenants(tdata.data);
			}
		});
		
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getDataByTenantID(tenantId, 'tenantFQDNs')).then((tdata: any) => {
			if (tdata != undefined) {
				setData(tdata.data);
			}
		});
		setIsLoading(false);

	}

	useEffect(() => {
		fetchProduct();
	}, []);

	const [ open, setOpen ] = useState(false);

	const handleClickOpen = () => {
		setId(0);
		setDescription('');
		setFQDN('');
		setOpen(true);
	};

	const handleClickOpenNoreset = () => {
		setOpen(true);
	};

	const handleDescriptionChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setDescription(event.target.value);
	};
	const handleFQDNChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setFQDN(event.target.value);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const delTenant = async () => {

		// add new data / mod data / error
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(deleteData(id, 'tenantFQDNs')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (id === 0) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(createData({ tenantId: tenantId, description: description, fqdn: fqdn }, 'tenantFQDNs')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		} else if (id != 0) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(patchData(id, { name: name, description: description }, 'tenantFQDNs')).then(() => {
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
					<TextField
						margin="dense"
						id="fqdn"
						label="fqdn"
						type="text"
						fullWidth
						onChange={handleFQDNChange}
						value={fqdn}
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
					// const ttenantId = r[1].getValue();
					const tdescription = r[2].getValue();
					const tfqdn = r[3].getValue();

					if (typeof tid === 'number') {
						setId(tid);
					}

					if (typeof tdescription === 'string') {
						setDescription(tdescription);
					} else {
						setDescription('');
					}
					if (typeof tfqdn === 'string') {
						setFQDN(tfqdn);
					} else {
						setFQDN('');
					}

					handleClickOpenNoreset();

				}
			})}
			columns={columns}
			data={data} // fallback to array if data is undefined
			initialState={{
				columnVisibility: {
					id: false,
					tenantId: false,
					description: false
				}
			}}
			state={{ isLoading }} /></>;
};

export default TenantFQDNTable;

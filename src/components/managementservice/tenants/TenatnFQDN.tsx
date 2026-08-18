import { useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { useMRTLocalization } from '../../../utils/mrtLocalization';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions } from '@mui/material';
import { Tenant, TenantFQDN } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData, getDataByTenantID, patchData } from '../../../store/actions/managementActions';
import { TenantProp } from './Tenant';
import { addNewLabel, applyLabel, cancelLabel, deleteLabel, descLabel, fqdnFieldLabel, fqdnFullLabel, genericItemDescLabel, manageItemLabel, tenantLabel, undefinedLabel } from '../../translated/translatedComponents';

const TenantFQDNTable = (props: TenantProp) => {
	const tenantId = props.tenantId;
	const dispatch = useAppDispatch();
	const localization = useMRTLocalization();

	type TenantOptionTypes = Array<Tenant>

	const [ tenants, setTenants ] = useState<TenantOptionTypes>([ { 'id': 0, 'name': '', 'description': '' } ]);

	const getTenantName = (id: string): string => {
		const t = tenants.find((type) => type.id == parseInt(id));

		if (t && t.name) {
			return t.name;
		} else {
			return `${tenantLabel()} - ${undefinedLabel()}`;
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
				// the row shows the tenant name, so filtering/sorting/search must
				// use the name too, not the raw tenantId
				id: 'tenantId',
				accessorFn: (row) => getTenantName(String(row.tenantId)),
				header: tenantLabel()

			},
			{
				accessorKey: 'description',
				header: descLabel()
			},
			{
				accessorKey: 'fqdn',
				header: fqdnFullLabel()
			},
			
		],
		[ tenants ],
	);

	const [ data, setData ] = useState([]);

	// MRT caches accessorFn results per row and only rebuilds its rows when the
	// data array identity changes. The rows and the lookups above are fetched
	// concurrently, so hand it a fresh array when a lookup resolves after the
	// rows, otherwise the resolved names stay stuck on their placeholder.
	const tableData = useMemo(() => [ ...(data ?? []) ], [ data, tenants ]);
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
			dispatch(deleteData(id, 'tenantFQDNs')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (id === 0) {
			dispatch(createData({ tenantId: tenantId, description: description, fqdn: fqdn }, 'tenantFQDNs')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		} else if (id != 0) {
			dispatch(patchData(id, { name: name, description: description }, 'tenantFQDNs')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}

	};

	return <>
		<div>
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
					<TextField
						margin="dense"
						id="fqdn"
						label={fqdnFieldLabel()}
						type="text"
						fullWidth
						onChange={handleFQDNChange}
						value={fqdn}
					/>
					<TextField
						margin="dense"
						id="description"
						label={descLabel()}
						type="text"
						fullWidth
						onChange={handleDescriptionChange}
						value={description}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={delTenant} color='warning'>{deleteLabel()}</Button>
					<Button onClick={handleClose}>{cancelLabel()}</Button>
					<Button onClick={addTenant}>{applyLabel()}</Button>
				</DialogActions>
			</Dialog>
		</div>
		<MaterialReactTable localization={localization}
			muiTableBodyRowProps={({ row }) => ({
				onClick: () => {

					const r = row.getAllCells();

					const tid = r[0].getValue();
					// const ttenantId = r[1].getValue();
					const tdescription = r[2].getValue();
					const tfqdn = r[3].getValue();

					if (typeof tid === 'number') {
						setId(tid);
					} else if (typeof tid == 'string') {
						setId(parseInt(tid));
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
			data={tableData} // fallback to array if data is undefined
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

import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Checkbox, FormControlLabel, Autocomplete } from '@mui/material';
import { Tenant, User } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import { addNewLabel, applyLabel, cancelLabel, deleteLabel, genericItemDescLabel, manageItemLabel, nameLabel, noLabel, rolesLabel, tenantAdminLabel, tenantLabel, tenantOwnerLabel, undefinedLabel, yesLabel } from '../../translated/translatedComponents';

const UserTable = () => {
	const dispatch = useAppDispatch();

	type TenantOptionTypes = Array<Tenant>

	const [ tenants, setTenants ] = useState<TenantOptionTypes>([ { 'id': 0, 'name': '', 'description': '' } ]);

	const getTenantName = (id: string): string => {
		const t = tenants.find((type) => type.id == parseInt(id));

		if (t && t.name) {
			return t.name;
		} else {
			return `${undefinedLabel()} ${tenantLabel()}`;
		}
	};

	// should be memoized or stable
	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<User>[]>(
		() => [

			{
				accessorKey: 'id',
				header: '#'
			},
			{
				accessorKey: 'ssoId',
				header: 'ssoId'
			},
			{
				accessorKey: 'tenantId',
				header: tenantLabel(),
				Cell: ({ cell }) => getTenantName(cell.getValue<string>())

			},
			{
				accessorKey: 'email',
				header: 'email'
			},
			{
				accessorKey: 'name',
				header: nameLabel()
			},
			{
				accessorKey: 'avatar',
				header: 'avatar'
			},
			{
				accessorKey: 'roles',
				header: rolesLabel()
			},
			{
				accessorKey: 'tenantAdmin',
				header: tenantAdminLabel(),
				filterVariant: 'checkbox',
				Cell: ({ cell }) =>
					(cell.getValue() === true ? yesLabel() : noLabel()),
                
			},
			{
				accessorKey: 'tenantOwner',
				Cell: ({ cell }) =>
					(cell.getValue() === true ? yesLabel() : noLabel()),
				header: tenantOwnerLabel(),
				filterVariant: 'checkbox'
			},
		],
		[ tenants ],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ ssoId, setSsoId ] = useState('');
	const [ tenantId, setTenantId ] = useState(0);
	const [ email, setEmail ] = useState('');
	const [ name, setName ] = useState('');
	const [ avatar, setAvatar ] = useState('');
	const [ tenantAdmin, setTenantAdmin ] = useState(false);
	const [ tenantOwner, setTenantOwner ] = useState(false);
	const [ tenantIdOption, setTenantIdOption ] = useState<Tenant | undefined>();

	async function fetchProduct() {

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('tenants')).then((tdata: any) => {
			if (tdata != undefined) {
				setTenants(tdata.data);
			}
			setIsLoading(false);

		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('users')).then((tdata: any) => {
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
		setName('');
		setSsoId('');
		setTenantId(0);
		setEmail('');
		setName('');
		setAvatar('');
		setTenantAdmin(false);
		setTenantOwner(false);
		setOpen(true);
	};

	const handleClickOpenNoreset = () => {
		setOpen(true);
	};
	const handleSsoIdChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setSsoId(event.target.value);
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
	const handleEmailChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setEmail(event.target.value);
	};
	const handleNameChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setName(event.target.value);
	};
	const handleAvatarChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setAvatar(event.target.value);
	};
	const handleTenantAdminChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setTenantAdmin(event.target.checked);
	};
	const handleTenantOwnerChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setTenantOwner(event.target.checked);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const delUser = async () => {

		// add new data / mod data / error
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			dispatch(deleteData(id, 'users')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}
	};

	const addUser = async () => {
		// only edit with limited fields createData will not work
		if (name != '' && id === 0) {
			dispatch(createData({ 
				name: name,
				avatar: avatar
			}, 'users')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		} else if (name != '' && id != 0) {
			dispatch(patchData(id, { 
				name: name,
				avatar: avatar
			}, 'users')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}
	};

	return <>
		<div>
			{ false &&
				<Button variant="outlined" onClick={() => handleClickOpen()}>
					{addNewLabel()}
				</Button>
			}
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
						id="ssoId"
						label="ssoId"
						type="text"
						required
						fullWidth
						onChange={handleSsoIdChange}
						value={ssoId}
						disabled
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
						disabled
						renderInput={(params) => <TextField {...params} label="Tenant" />}
					/>
					<TextField
						margin="dense"
						id="email"
						label="Email"
						type="email"
						required
						fullWidth
						onChange={handleEmailChange}
						value={email}
						disabled
					/>
					<TextField
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
						id="avatar"
						label="avatar"
						type="text"
						fullWidth
						onChange={handleAvatarChange}
						value={avatar}
					/>
					{/* roles */}
					<FormControlLabel control={<Checkbox disabled checked={tenantAdmin} onChange={handleTenantAdminChange} />} label="tenantAdmin" />
					<FormControlLabel control={<Checkbox disabled checked={tenantOwner} onChange={handleTenantOwnerChange} />} label="tenantOwner" />

				</DialogContent>
				<DialogActions>
					{ false &&
						<Button onClick={delUser} color='warning'>{deleteLabel()}</Button>
					}
					<Button onClick={handleClose}>{cancelLabel()}</Button>
					<Button onClick={addUser} disabled={name.trim() === ''}>{applyLabel()}</Button>
				</DialogActions>
			</Dialog>
		</div>
		<MaterialReactTable
			muiTableBodyRowProps={({ row }) => ({
				onClick: () => {
					const u = row.original as any;

					setId(typeof u.id === 'number' ? u.id : parseInt(String(u.id)));
					setSsoId(typeof u.ssoId === 'string' ? u.ssoId : '');
					setEmail(typeof u.email === 'string' ? u.email : '');
					setName(typeof u.name === 'string' ? u.name : '');
					setAvatar(typeof u.avatar === 'string' ? u.avatar : '');

					if (u.tenantId != null) {
						const tid = typeof u.tenantId === 'number' ? u.tenantId : parseInt(String(u.tenantId));

						setTenantId(tid);

						const ttenant = tenants.find((x) => x.id == tid);

						if (ttenant) setTenantIdOption(ttenant);
					} else {
						setTenantId(0);
						setTenantIdOption(undefined);
					}

					setTenantAdmin(!!u.tenantAdmin);
					setTenantOwner(!!u.tenantOwner);

					handleClickOpenNoreset();
				}
			})}
			columns={columns}
			data={data} // fallback to array if data is undefined
			initialState={{
				columnVisibility: {
					avatar: false,
					ssoId: false,
				}
			}}
			state={{ isLoading }}
		/>
	</>;
};

export default UserTable;

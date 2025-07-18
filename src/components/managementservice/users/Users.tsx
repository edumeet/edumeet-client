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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(deleteData(id, 'users')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}
	};

	const addUser = async () => {

		// add new data / mod data / error
		if (name != '' && id === 0) {

			dispatch(createData({ 
				ssoId: ssoId,
				tenantId: tenantId,
				email: email,
				name: name,
				avatar: avatar
			}, 'users')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		} else if (name != '' && id != 0) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(patchData(id, { 
				ssoId: ssoId,
				tenantId: tenantId,
				email: email,
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
						autoFocus
						margin="dense"
						id="ssoId"
						label="ssoId"
						type="text"
						required
						fullWidth
						onChange={handleSsoIdChange}
						value={ssoId}
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
					<TextField
						autoFocus
						margin="dense"
						id="email"
						label="Email"
						type="email"
						required
						fullWidth
						onChange={handleEmailChange}
						value={email}
					/>
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
					<Button onClick={delUser} color='warning'>{deleteLabel()}</Button>
					<Button onClick={handleClose}>{cancelLabel()}</Button>
					<Button onClick={addUser}>{applyLabel()}</Button>
				</DialogActions>
			</Dialog>
		</div>
		<MaterialReactTable
			muiTableBodyRowProps={({ row }) => ({
				onClick: () => {

					const r = row.getAllCells();

					const tid = r[0].getValue();
					const tssoId=r[1].getValue();
					const ttenantId=r[2].getValue();
					const temail=r[3].getValue();
					const tname=r[4].getValue();
					const tavatar=r[5].getValue();
					// const troles=r[6].getValue();
					// const ttenantAdmin=r[7].getValue();
					// const ttenantOwner=r[8].getValue();
	
					if (typeof tid === 'number') {
						setId(tid);
					} else if (typeof tid == 'string') {
						setId(parseInt(tid));
					}

					if (typeof tssoId === 'string') {
						setSsoId(tssoId);
					} else {
						setSsoId('');
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
					if (typeof temail === 'string') {
						setEmail(temail);
					} else {
						setEmail('');
					}
					if (typeof tname === 'string') {
						setName(tname);
					} else {
						setName('');
					}
					if (typeof tavatar === 'string') {
						setAvatar(tavatar);
					} else {
						setAvatar('');
					}
					// todo roles
					/* if (ttenantAdmin === true) {
						setTenantAdmin(true);
					} else {
						setTenantAdmin(false);
					}
					if (ttenantOwner === true) {
						setTenantOwner(true);
					} else {
						setTenantOwner(false);
					} */

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

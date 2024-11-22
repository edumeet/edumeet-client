/* eslint-disable camelcase */
import { useEffect, useMemo, useState } from 'react';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions } from '@mui/material';
import { Tenant, TenantOAuth } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData, getDataByID, patchData } from '../../../store/actions/managementActions';
import { notificationsActions } from '../../../store/slices/notificationsSlice';
import { TenantProp } from './Tenant';

const TenantOAuthTable = (props: TenantProp) => {
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
	const columns = useMemo<MRT_ColumnDef<TenantOAuth>[]>(
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
				accessorKey: 'access_url',
				header: 'Access URL'
			},
			{
				accessorKey: 'authorize_url',
				header: 'Authorize URL'
			},
			{
				accessorKey: 'profile_url',
				header: 'Profile URL'
			},
			{
				accessorKey: 'redirect_uri',
				header: 'Redirect URI'
			},
			{
				accessorKey: 'scope',
				header: 'Scope'
			},
			{
				accessorKey: 'scope_delimiter',
				header: 'Scope delimiter'
			},
			
		],
		[ tenants ],
	);

	const [ data, setData ] = useState([]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ profileUrl, setProfileUrl ] = useState('');
	const [ wellknown, setWellknown ] = useState('');
	const [ wellknownEmpty, setWellknownEmpty ] = useState(true);

	const [ key, setKey ] = useState('');
	const [ secret, setSecret ] = useState('');
	const [ authorizeUrl, setAuthorizeUrl ] = useState('');
	const [ accessUrl, setAccessUrl ] = useState('');
	const [ scope, setScope ] = useState('');
	const [ scopeDelimeter, setScopeDelimeter ] = useState('');
	const [ redirect, setRedirect ] = useState('');
	
	async function fetchProduct() {
		setIsLoading(true);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('tenants')).then((tdata: any) => {
			if (tdata != undefined) {
				setTenants(tdata.data);
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getDataByID(tenantId, 'tenantOAuths')).then((tdata: any) => {
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
		setProfileUrl('https://edumeet.example.com/kc/realms/<realm>/protocol/openid-connect/userinfo');
		setKey('edumeet-dev-client');
		setSecret('');
		setAuthorizeUrl('https://edumeet.example.com/kc/realms/<realm>/protocol/openid-connect/auth');
		setAccessUrl('https://edumeet.example.com/kc/realms/<realm>/protocol/openid-connect/token');
		setScope('openid profile email');
		setScopeDelimeter(' ');
		setRedirect('https://edumeet.example.com/mgmt/oauth/tenant/callback');
		setOpen(true);
	};

	const handleClickOpenNoreset = () => {
		setOpen(true);
	};

	const handleProfileUrlChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setProfileUrl(event.target.value);
	};

	const handleWellknownChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setWellknown(event.target.value);
		if (event.target.value != null && event.target.value.length > 10) {
			setWellknownEmpty(false);
		} else {
			setWellknownEmpty(true);
		}

	};
	
	const handleWellknownUpdate = () => {

		fetch(wellknown, {
			method: 'GET',
		}).then(async (response) => {
			if (!response.ok) {
				dispatch(notificationsActions.enqueueNotification({
					message: response.statusText.toString(),
					options: { variant: 'error' }
				}));
			} else {
				const json = await response.json(); // assuming they return json

				if (json.token_endpoint!=null)
					setAccessUrl(json.token_endpoint);
				if (json.authorization_endpoint!=null)
					setAuthorizeUrl(json.authorization_endpoint);
				if (json.userinfo_endpoint!=null)
					setProfileUrl(json.userinfo_endpoint);

			}
		})
			.catch((error) => {
				dispatch(notificationsActions.enqueueNotification({
					message: error.toString(),
					options: { variant: 'error' }
				}));
			});

	};
	
	const handleKeyChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setKey(event.target.value);
	};

	const handleSecretChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setSecret(event.target.value);
	};

	const handleAuthorizeUrlChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setAuthorizeUrl(event.target.value);
	};

	const handleAccessUrlChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setAccessUrl(event.target.value);
	};

	const handleScopeChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setScope(event.target.value);
	};

	const handleScopeDelimeterChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setScopeDelimeter(event.target.value);
	};

	const handleRedirectChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setRedirect(event.target.value);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const delTenant = async () => {

		// add new data / mod data / error
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(deleteData(id, 'tenantOAuths')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (id === 0) {

			dispatch(createData({ 
				'key': key,
				'secret': secret,
				'tenantId': tenantId,
				'access_url': accessUrl,
				'authorize_url': authorizeUrl,
				'profile_url': profileUrl,
				'redirect_uri': redirect,
				'scope': scope,
				'scope_delimiter': scopeDelimeter
			}, 'tenantOAuths')).then(() => {
				fetchProduct();
				setOpen(false);
			});

		} else if (id != 0) {
			dispatch(patchData(id, { 
				'tenantId': tenantId,
				'access_url': accessUrl,
				'authorize_url': authorizeUrl,
				'profile_url': profileUrl,
				'redirect_uri': redirect,
				'scope': scope,
				'scope_delimiter': scopeDelimeter }, 'tenantOAuths')).then(() => {
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
			<Dialog maxWidth="lg" open={open} onClose={handleClose}>
				<DialogTitle>Add/Edit</DialogTitle>
				<DialogContent>
					<DialogContentText>
						These are the parameters that you can change.
					</DialogContentText>
					<input type="hidden" name="id" value={id} />
					{/* <TextField
						autoFocus
						margin="dense"
						id="tenantId"
						label="tenantId"
						type="number"
						required
						fullWidth
						onChange={handleTenantIdChange}
						value={tenantId}
					/> */}
					<TextField
						margin="dense"
						required
						id="wellknown"
						label="Well-known URL"
						type="text"
						fullWidth
						value={wellknown}
						onChange={handleWellknownChange}
					/>
					<Button onClick={handleWellknownUpdate} variant="contained" fullWidth disabled={wellknownEmpty} >Update parameters from URL</Button>
					<TextField
						margin="dense"
						required
						id="key"
						label="key"
						type="text"
						fullWidth
						value={key}
						onChange={handleKeyChange}
					/>
					<TextField
						required
						margin="dense"

						id="secret"
						label="secret"
						type="text"
						fullWidth
						value={secret}
						onChange={handleSecretChange}
					/>
					<TextField
						required
						margin="dense"
						id="access_url"
						label="access_url"
						type="text"
						fullWidth
						value={accessUrl}
						onChange={handleAccessUrlChange}
					/>
					<TextField
						required
						margin="dense"

						id="authorize_url"
						label="authorize_url"
						type="text"
						fullWidth
						value={authorizeUrl}
						onChange={handleAuthorizeUrlChange}
					/>
					<TextField
						required
						margin="dense"
						id="profile_url"
						label="profile_url"
						type="text"
						fullWidth
						onChange={handleProfileUrlChange}
						value={profileUrl}
					/>
					<TextField
						required
						margin="dense"

						id="scope"
						label="scope"
						type="text"
						fullWidth
						value={scope}
						onChange={handleScopeChange}
					/>
					<TextField
						margin="dense"
						required

						id="scope_delimiter"
						label="scope_delimiter"
						type="text"
						fullWidth
						value={scopeDelimeter}
						onChange={handleScopeDelimeterChange}
					/>
					<TextField
						required
						margin="dense"
						id="redirect_url"
						label="redirect_url"
						type="text"
						fullWidth
						value={redirect}
						onChange={handleRedirectChange}
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
					// const ttenantId= r[1].getValue();
					const taccess= r[2].getValue();
					const tauthorize= r[3].getValue();
					const tprofile= r[4].getValue();
					const tredirect= r[5].getValue();
					const tscope= r[6].getValue();
					const tscopeDelimiter= r[7].getValue();

					if (typeof tid === 'number') {
						setId(tid);
					}
					if (typeof tprofile === 'string') { setProfileUrl(tprofile); } else {
						setProfileUrl('');
					}
					if (typeof tauthorize === 'string') { setAuthorizeUrl(tauthorize); } else {
						setAuthorizeUrl('');
					}
					if (typeof taccess === 'string') { setAccessUrl(taccess); } else {
						setAccessUrl('');
					}
					if (typeof tscope === 'string') { setScope(tscope); } else {
						setScope('');
					}
					if (typeof tscopeDelimiter === 'string') { setScopeDelimeter(tscopeDelimiter); } else {
						setScopeDelimeter('');
					}
					if (typeof tredirect === 'string') { setRedirect(tredirect); } else {
						setRedirect('');
					}

					handleClickOpenNoreset();

				}
			})}
			columns={columns}
			data={data} // fallback to array if data is undefined
			initialState={{
				columnVisibility: {
					access_url: false,
					authorize_url: false,
					profile_url: false,
					scope_delimiter: false,
				}
			}}
			state={{ isLoading }} /></>;
};

export default TenantOAuthTable;
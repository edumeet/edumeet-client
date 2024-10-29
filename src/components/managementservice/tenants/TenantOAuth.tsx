import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Autocomplete, Snackbar } from '@mui/material';
import React from 'react';
import MuiAlert, { AlertColor, AlertProps } from '@mui/material/Alert';
import { Tenant, TenantOAuth } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createTenantOAuth, deleteTenantOAuth, getTenantOAuths, getTenants, modifyTenantOAuth } from '../../../store/actions/managementActions';

const TenantOAuthTable = () => {

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
	const [ tenantId, setTenantId ] = useState(0);
	const [ profileUrl, setProfileUrl ] = useState('');
	const [ wellknown, setWellknown ] = useState('');
	const [ wellknownEpmty, setWellknownEmpty ] = useState(true);

	const [ key, setKey ] = useState('');
	const [ secret, setSecret ] = useState('');
	const [ authorizeUrl, setAuthorizeUrl ] = useState('');
	const [ accessUrl, setAccessUrl ] = useState('');
	const [ scope, setScope ] = useState('');
	const [ scopeDelimeter, setScopeDelimeter ] = useState('');
	const [ redirect, setRedirect ] = useState('');
	const [ tenantIdOption, setTenantIdOption ] = useState<Tenant | undefined>();

	async function fetchProduct() {
		setIsLoading(true);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getTenants()).then((tdata: any) => {
			// eslint-disable-next-line no-console
			console.log('Tenant data', tdata);
			if (tdata != undefined) {
				setTenants(tdata.data);
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getTenantOAuths()).then((tdata: any) => {
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
		setTenantId(0);
		setProfileUrl('https://edumeet.example.com/kc/realms/<realm>/protocol/openid-connect/userinfo');
		setKey('edumeet-dev-client');
		setSecret('');
		setAuthorizeUrl('https://edumeet.example.com/kc/realms/<realm>/protocol/openid-connect/auth');
		setAccessUrl('https://edumeet.example.com/kc/realms/<realm>/protocol/openid-connect/token');
		setScope('openid profile email');
		setScopeDelimeter(' ');
		setTenantIdOption(undefined);
		setTenantId(0);
		setRedirect('https://edumeet.example.com/mgmt/oauth/tenant/callback');
		setOpen(true);
	};

	const handleClickOpenNoreset = () => {
		setOpen(true);
	};

	const handleTenantIdChange = (event: SyntheticEvent<Element, Event>, newValue: Tenant) => {
		if (newValue) {
			setTenantId(newValue.id);
			setTenantIdOption(newValue);
		}
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
				setAlertMessage(response.statusText.toString());
				setAlertSeverity('error');
				setAlertOpen(true);
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
				setAlertMessage(error.toString());
				setAlertSeverity('error');
				setAlertOpen(true);
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
			dispatch(deleteTenantOAuth(id)).then((tdata: any) => {
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
		if (id === 0) {

			dispatch(createTenantOAuth({ 
				'key': key,
				'secret': secret,
				'tenantId': tenantId,
				'access_url': accessUrl,
				'authorize_url': authorizeUrl,
				'profile_url': profileUrl,
				'redirect_uri': redirect,
				'scope': scope,
				'scope_delimiter': scopeDelimeter
			})).then((tdata: unknown) => {
				// eslint-disable-next-line no-console
				console.log('Tenant data', tdata);
				fetchProduct();
				setOpen(false);
				// TODO finish
				setAlertMessage('Successfull add!');
				setAlertSeverity('success');
				setAlertOpen(true);
	
			});

		} else if (id != 0) {
			dispatch(modifyTenantOAuth(id, { 
				'tenantId': tenantId,
				'access_url': accessUrl,
				'authorize_url': authorizeUrl,
				'profile_url': profileUrl,
				'redirect_uri': redirect,
				'scope': scope,
				'scope_delimiter': scopeDelimeter })).then((tdata: unknown) => {
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
					<Autocomplete
						options={tenants}
						getOptionLabel={(option) => option.name}
						fullWidth
						disableClearable
						onChange={handleTenantIdChange}
						value={tenantIdOption}
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField {...params} label="Tenant" />}
					/>
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
					<Button onClick={handleWellknownUpdate} variant="contained" fullWidth disabled={wellknownEpmty} >Update parameters from URL</Button>
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
					const ttenantId= r[1].getValue();
					const taccess= r[2].getValue();
					const tauthorize= r[3].getValue();
					const tprofile= r[4].getValue();
					const tredirect= r[5].getValue();
					const tscope= r[6].getValue();
					const tscopeDelimiter= r[7].getValue();

					if (typeof tid === 'number') {
						setId(tid);
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
				columnVisibility: {}
			}}
			state={{ isLoading }} /></>;
};

export default TenantOAuthTable;
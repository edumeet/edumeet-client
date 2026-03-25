import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Autocomplete, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Box } from '@mui/material';
import React from 'react';
import { Groups, Rule, Tenant } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import { accessIdLabel, actionLabel, actionToRunLabel, addNewLabel, applyLabel, assertLabel, cancelLabel, containsLabel, deleteLabel, endswithLabel, equalsLabel, gainLabel, genericItemDescLabel, makeUserGroupMemberLabel, makeUserSuperAdminLabel, makeUserTenantAdminLabel, makeUserTenantOwnerLabel, manageItemLabel, methodLabel, nameLabel, negateLabel, parameterLabel, startswithLabel, tenantLabel, typeLablel, undefinedTenantLabel, valueLabel } from '../../translated/translatedComponents';

const RuleTable = () => {
	const dispatch = useAppDispatch();

	type TenantOptionTypes = Array<Tenant>

	const [ tenants, setTenants ] = useState<TenantOptionTypes>([ { 'id': 0, 'name': '', 'description': '' } ]);
	const { superAdmin } = useAppSelector((state) => state.management);

	const getTenantName = (id: string): string => {
		const t = tenants.find((type) => type.id == parseInt(id));

		if (t && t.name) {
			return t.name;
		} else {
			return undefinedTenantLabel();
		}
	};
	// should be memoized or stable
	// eslint-disable-next-line camelcase
	const columns = useMemo<MRT_ColumnDef<Rule>[]>(
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
				accessorKey: 'tenantId',
				header: tenantLabel(),
				accessorFn: (row) => getTenantName(String(row.tenantId ?? ''))
			},
			{
				accessorKey: 'type',
				header: typeLablel()
			},
			{
				accessorKey: 'parameter',
				header: parameterLabel()
			},
			{
				accessorKey: 'method',
				header: methodLabel()
			},
			{
				accessorKey: 'negate',
				header: negateLabel()
			},
			{
				accessorKey: 'value',
				header: valueLabel()
			},
			{
				accessorKey: 'action',
				header: actionLabel()
			},
			{
				accessorKey: 'accessId',
				header: accessIdLabel()
			}			
		],
		[ tenants ],
	);

	const [ data, setData ] = useState([]);

	type GroupsOptionTypes = Array<Groups>
	const [ groups, setGroups ] = useState<GroupsOptionTypes>([ {
		'id': 0,
		'name': '',   
		'description': '',
		'tenantId': 0
	}
	]);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ name, setName ] = useState('');
	const [ tenantId, setTenantId ] = useState(0);
	const [ type, setType ] = useState('');
	const [ parameter, setParameter ] = useState('');
	const [ method, setMethod ] = useState('');	
	const [ negate, setNegate ] = useState(false);
	const [ value, setValue ] = useState('');
	const [ action, setAction ] = useState('');
	const [ accessId, setAccessId ] = useState('');
	const [ cantPatch ] = useState(false);
	const [ cantDelete, setCantDelete ] = useState(false);
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
		dispatch(getData('rules')).then((tdata: any) => {
			if (tdata != undefined) {
				setData(tdata.data);
			}
			setIsLoading(false);
    
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('groups')).then((tdata: any) => {
			if (tdata != undefined) {
				setGroups(tdata.data);
			}
			setIsLoading(false);
			
		});
	}

	useEffect(() => {
		setIsLoading(true);
		fetchProduct();
	}, []);

	const [ open, setOpen ] = React.useState(false);

	const handleClickOpen = () => {
		setId(0);
		setName('');
		setTenantId(0);
		setCantDelete(true);
		setOpen(true);
		setTenantIdOption(undefined);
		setType('');
		setParameter('');
		setMethod('');
		setNegate(false);
		setValue('');
		setAction('');
		setAccessId('');
	};

	const handleClickOpenNoreset = () => {
		setCantDelete(false);
		setOpen(true);
	};

	const handleNameChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setName(event.target.value);
	};

	const handleTypeChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setType(event.target.value);
	};
	
	const handleParameterChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setParameter(event.target.value);
	};
	
	const handleMethodChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setMethod(event.target.value);
	};
	
	const handleNegateChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setNegate(event.target.checked);
	};

	const handleValueChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setValue(event.target.value);
	};

	const handleActionChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setAction(event.target.value);
	};
	const handleAccessIdChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setAccessId(event.target.value);
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

	const handleClose = () => {
		setOpen(false);
	};

	const delTenant = async () => {

		// add new data / mod data / error
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			dispatch(deleteData(id, 'rules')).then(() => {
				fetchProduct();
				setOpen(false);
			});
		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (name != '' && id === 0) {
			// add new assert rule
			if (type=='gain' && action=='groupUsers') {
				// gain
				dispatch(createData({ 
					name: name,
					tenantId: tenantId,
					parameter: parameter,
					method: method,
					negate: negate,
					value: value,
					action: action,
					type: type,
					accessId: accessId
				}, 'rules')).then(() => {
					fetchProduct();
					setOpen(false);
				});
			} else {
				// assert
				dispatch(createData({ 
					name: name,
					tenantId: tenantId,
					parameter: parameter,
					method: method,
					negate: negate,
					value: value,
					action: action,
					type: type,
					accessId: ''
				}, 'rules')).then(() => {
					fetchProduct();
					setOpen(false);
				});
			}
		} else if (name != '' && id != 0) {
			if (type=='gain' && action=='groupUsers') {
				// gain
				dispatch(patchData(id, { 
					name: name,
					tenantId: tenantId,
					parameter: parameter,
					method: method,
					negate: negate,
					value: value,
					action: action,
					type: type,
					accessId: accessId
				}, 'rules')).then(() => {
					fetchProduct();
					setOpen(false);
				});
			} else {
				// assert
				dispatch(patchData(id, { 
					name: name,
					tenantId: tenantId,
					parameter: parameter,
					method: method,
					negate: negate,
					value: value,
					action: action,
					type: type,
					accessId: ''
				}, 'rules')).then(() => {
					fetchProduct();
					setOpen(false);
				});
			}
		} 
		setIsLoading(false);
	};
	
	return <>
		<div>
			<Button variant="outlined" onClick={() => handleClickOpen()}>
				{addNewLabel()}
			</Button>
			<hr />
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
						label={nameLabel()}
						type="text"
						required
						fullWidth
						onChange={handleNameChange}
						value={name}
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
						renderInput={(params) => <TextField {...params} label={tenantLabel()} />}
					/>
					<FormControl 
						sx={{ marginTop: '8px' }}
						fullWidth >
						<InputLabel id="type-label">{typeLablel()}</InputLabel>
						<Select
							required
							labelId="type-label"
							id="type"
							value={type}
							label={typeLablel()}
							onChange={handleTypeChange}
						>
							<MenuItem value={'assert'}>{assertLabel()}</MenuItem>
							<MenuItem value={'gain'}>{gainLabel()}</MenuItem>
						</Select>
					</FormControl>
					<TextField
						margin="dense"
						id="parameter"
						label={parameterLabel()}
						type="text"
						required
						fullWidth
						sx={{ marginTop: '8px' }}
						onChange={handleParameterChange}
						value={parameter}
					/>

					<FormControl
						sx={{ marginTop: '8px' }}
						fullWidth>
						<InputLabel id="method-label">{methodLabel()}</InputLabel>
						<Select
							labelId="method-label"
							id="method"
							value={method}
							label={methodLabel()}
							required
							onChange={handleMethodChange}
						>
							<MenuItem value={'contains'}>{containsLabel()}</MenuItem>
							<MenuItem value={'equals'}>{equalsLabel()}</MenuItem>
							<MenuItem value={'startswith'}>{startswithLabel()}</MenuItem>
							<MenuItem value={'endswith'}>{endswithLabel()}</MenuItem>
						</Select>
					</FormControl>
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
					>
						<FormControlLabel style={{ textAlign: 'center' }} control={<Checkbox onChange={handleNegateChange} checked={negate} />} label={negateLabel()} />
					</Box>

					<TextField
						margin="dense"
						id="value"
						label={valueLabel()}
						type="text"
						required
						fullWidth
						onChange={handleValueChange}
						value={value}
					/>
					{type==='gain' && 
					<>
						<FormControl
							sx={{ marginTop: '8px' }}
							fullWidth>
							<InputLabel id="action-label">{actionToRunLabel()}</InputLabel>
							<Select
								labelId="action-label"
								id="action"
								value={action}
								disabled={type !== 'gain'}

								label={actionToRunLabel()}
								required
								onChange={handleActionChange}
							>
								<MenuItem value={'groupUsers'}>{makeUserGroupMemberLabel()}</MenuItem>
								<MenuItem value={'tenantOwners'}>{makeUserTenantOwnerLabel()}</MenuItem>
								<MenuItem value={'tenantAdmins'}>{makeUserTenantAdminLabel()}</MenuItem>
								<MenuItem value={'superAdmin'} disabled={!superAdmin}>{makeUserSuperAdminLabel()}</MenuItem>
							</Select>
						</FormControl>
						{action=='groupUsers' && 
						<FormControl
							sx={{ marginTop: '8px' }}
							fullWidth>
							<InputLabel id="accessid-label">{accessIdLabel()}</InputLabel>
							<Select
								labelId="accessid-label"
								id="accessid"
								value={accessId}
								disabled={type !== 'gain'}
								label={accessIdLabel()}
								required
								onChange={handleAccessIdChange}
							>
								{Object.entries(groups).map(([ , v ]) =>
									<MenuItem value={v.id}>{v.name}</MenuItem>
								)}
							</Select>
						</FormControl>
						}
					</>
					}

				</DialogContent>
				<DialogActions>
					<Button onClick={delTenant} disabled={cantDelete} color='warning'>{deleteLabel()}</Button>
					<Button onClick={handleClose}>{cancelLabel()}</Button>
					<Button onClick={addTenant} disabled={cantPatch}>{applyLabel()}</Button>
				</DialogActions>
			</Dialog>
		</div>
		<MaterialReactTable
			muiTableBodyRowProps={({ row }) => ({
				onClick: async () => {
					const r = row.getAllCells();
					const tid = r[0].getValue();
					const tname = r[1].getValue();
					const ttenantId = r[2].getValue();

					const ttype = r[3].getValue(); 
					const tparameter = r[4].getValue();
					const tmethod = r[5].getValue();
					const tnegate = r[6].getValue();
					const tvalue = r[7].getValue();
					const taction = r[8].getValue();
					const taccessid = r[9].getValue();

					if (typeof tid === 'number') {
						setId(tid);
					} else if (typeof tid == 'string') {
						setId(parseInt(tid));
					}

					if (typeof tname === 'string') {
						setName(tname);
					} else {
						setName('');
					}
					
					if (typeof ttenantId === 'number') {
						const ttenant = tenants.find((x) => x.id == ttenantId);

						if (ttenant) {
							setTenantIdOption(ttenant);
						}
						setTenantId(ttenantId);
					} else if (typeof ttenantId === 'string') {
						const ttenant = tenants.find((x) => x.id == parseInt(ttenantId));

						if (ttenant) {
							setTenantIdOption(ttenant);
						}
						setTenantId(parseInt(ttenantId));
					} else {
						setTenantId(0);
					}

					if (typeof ttype === 'string') {
						setType(ttype);
					} else {
						setType('');
					}
					if (typeof tparameter === 'string') {
						setParameter(tparameter);
					} else {
						setParameter('');
					}
					if (typeof tmethod === 'string') {
						setMethod(tmethod);
					} else {
						setMethod('');
					}
					if (typeof tnegate === 'boolean') {
						setNegate(tnegate);
					}
					if (typeof tvalue === 'string') {
						setValue(tvalue);
					} else {
						setValue('');
					}
					if (typeof taction === 'string') {
						setAction(taction);
					} else {
						setAction('');
					}
					if (typeof taccessid === 'string') {
						setAccessId(taccessid);
					} else {
						setAccessId('');
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

export default RuleTable;

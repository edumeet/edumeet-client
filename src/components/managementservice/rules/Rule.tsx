import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { useMRTLocalization } from '../../../utils/mrtLocalization';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Autocomplete, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Box } from '@mui/material';
import React from 'react';
import { Groups, Rule, Tenant } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import { accessIdLabel, actionLabel, actionToRunLabel, addNewLabel, applyLabel, assertLabel, cancelLabel, containsLabel, deleteLabel, endswithLabel, equalsLabel, gainLabel, genericItemDescLabel, makeUserGroupMemberLabel, makeUserSuperAdminLabel, makeUserTenantAdminLabel, makeUserTenantOwnerLabel, manageItemLabel, methodLabel, nameLabel, negateLabel, noLabel, parameterHelpLabel, parameterLabel, startswithLabel, tenantLabel, typeLablel, undefinedTenantLabel, valueLabel, yesLabel } from '../../translated/translatedComponents';

// The only attributes an SSO login carries into the rule hooks (see
// OAuthTenantStrategy.getEntityData on the management server). The field stays
// free text so rules predating this list keep their value, but anything outside
// it can never match.
const RULE_PARAMETERS = [ 'email', 'name', 'ssoId', 'tenantId' ];

const RuleTable = () => {
	const dispatch = useAppDispatch();
	const localization = useMRTLocalization();

	type TenantOptionTypes = Array<Tenant>

	// empty until the fetch resolves; a placeholder row would be preselected as the
	// rule's tenant by handleClickOpen and shown as a nameless option
	const [ tenants, setTenants ] = useState<TenantOptionTypes>([]);
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
				// the row shows the tenant name, so filtering/sorting/search must
				// use the name too, not the raw tenantId
				id: 'tenantId',
				accessorFn: (row) => getTenantName(String(row.tenantId ?? '')),
				header: tenantLabel()
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
				// a raw boolean renders as an empty cell, and negate inverts the whole
				// meaning of a rule, so it has to be readable. accessorFn (not Cell) so
				// search and column filters work on what is displayed.
				id: 'negate',
				accessorFn: (row) => (row.negate ? yesLabel() : noLabel()),
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

	// MRT caches accessorFn results per row and only rebuilds its rows when the
	// data array identity changes. The rows and the lookups above are fetched
	// concurrently, so hand it a fresh array when a lookup resolves after the
	// rows, otherwise the resolved names stay stuck on their placeholder.
	const tableData = useMemo(() => [ ...(data ?? []) ], [ data, tenants ]);

	type GroupsOptionTypes = Array<Groups>
	const [ groups, setGroups ] = useState<GroupsOptionTypes>([]);
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

	// Postgres returns the bigint id columns as strings, so ids coming from the API
	// and ids held in local state are not always the same type. Compare on the
	// string form, the way the rest of this file's lookups do.
	const sameId = (a: unknown, b: unknown): boolean => String(a) === String(b);

	// A rule can only grant a group that belongs to the rule's own tenant, so the
	// picker must not offer groups from anywhere else.
	const tenantGroups = useMemo(
		() => groups.filter((g) => sameId(g.tenantId, tenantId)),
		[ groups, tenantId ]
	);

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
		setCantDelete(true);
		setOpen(true);

		// Preselect a tenant, the same way Groups does. A tenant admin only ever sees
		// their own, and a super admin is no longer pinned to theirs server side, so
		// leaving this blank would mean the rule has no tenant to belong to.
		if (tenants.length > 0) {
			setTenantId(Number(tenants[0].id));
			setTenantIdOption(tenants[0]);
		} else {
			setTenantId(0);
			setTenantIdOption(undefined);
		}

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
	
	const handleParameterChange = (event: SyntheticEvent<Element, Event>, newValue: string) => {
		setParameter(newValue);
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
			const newTenantId = typeof newValue.id != 'number' ? parseInt(newValue.id) : newValue.id;

			setTenantId(newTenantId);
			setTenantIdOption(newValue);

			// The selected group belongs to the tenant we just moved away from
			if (accessId && !groups.some((g) => sameId(g.id, accessId) && sameId(g.tenantId, newTenantId))) {
				setAccessId('');
			}
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

		// A rule is always scoped to a tenant, and a super admin is no longer pinned
		// to their own, so submitting without one would fail the foreign key.
		if (tenantId === 0) {
			setIsLoading(false);

			return;
		}

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
					<Autocomplete
						freeSolo
						options={RULE_PARAMETERS}
						inputValue={parameter}
						onInputChange={handleParameterChange}
						fullWidth
						sx={{ marginTop: '8px' }}
						renderInput={(params) => <TextField
							{...params}
							margin="dense"
							id="parameter"
							label={parameterLabel()}
							required
							helperText={parameterHelpLabel()}
						/>}
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
						sx= {{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center'
						}}
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
								// groups load asynchronously; show nothing rather than an
								// out-of-range value until the matching option exists
								value={tenantGroups.some((g) => sameId(g.id, accessId)) ? accessId : ''}
								disabled={type !== 'gain'}
								label={accessIdLabel()}
								required
								onChange={handleAccessIdChange}
							>
								{tenantGroups.map((g) =>
									<MenuItem key={g.id} value={String(g.id)}>{g.name}</MenuItem>
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
					<Button onClick={addTenant} disabled={cantPatch || tenantId === 0}>{applyLabel()}</Button>
				</DialogActions>
			</Dialog>
		</div>
		<MaterialReactTable localization={localization}
			muiTableBodyRowProps={({ row }) => ({
				onClick: async () => {
					const r = row.getAllCells();
					const tid = r[0].getValue();
					const tname = r[1].getValue();
					const ttenantId: unknown = row.original.tenantId;

					const ttype = r[3].getValue(); 
					const tparameter = r[4].getValue();
					const tmethod = r[5].getValue();
					// read through row.original: the negate cell renders a yes/no label,
					// and MySQL hands the column back as 0/1 rather than a boolean
					const tnegate = Boolean(row.original.negate);
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
					setNegate(tnegate);
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
					// stored as a string, but normalise so the group Select can match
					// its (stringified) option values and preselect the group
					setAccessId(taccessid == null ? '' : String(taccessid));

					handleClickOpenNoreset();
				}
			})}
			columns={columns}
			data={tableData} // fallback to array if data is undefined
			initialState={{
				columnVisibility: {
				}
			}}
			state={{ isLoading }}
		/>
	</>;
};

export default RuleTable;

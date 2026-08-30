import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { useMRTLocalization } from '../../../utils/mrtLocalization';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Autocomplete, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import React from 'react';
import { Groups, Rule, Tenant } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import { accessIdLabel, accessLabel, actionLabel, actionToRunLabel, addNewLabel, allowLabel, applyLabel, blockLabel, cancelLabel, closeLabel, containsLabel, deleteLabel, effectLabel, endswithLabel, equalsLabel, gainLabel, genericItemDescLabel,
	rulesHelpTitleLabel, rulesHelpKindsLabel, rulesHelpStepsLabel, rulesHelpClosesLabel, rulesHelpBlockLabel, rulesHelpOpenLabel,
	matchesAnyoneLabel, rulesHelpAdminsLabel, rulesHelpGrantLabel, rulesHelpGrantKeepLabel, rulesHelpGrantAccessLabel, makeUserGroupMemberLabel, makeUserSuperAdminLabel, makeUserTenantAdminLabel, makeUserTenantOwnerLabel, manageItemLabel, methodLabel, nameLabel, parameterHelpLabel, parameterLabel, startswithLabel, tenantLabel, typeLablel, undefinedTenantLabel, valueLabel, doesNotContainLabel, doesNotEqualLabel, doesNotStartWithLabel, doesNotEndWithLabel } from '../../translated/translatedComponents';

// The only attributes an SSO login carries into the rule hooks (see
// OAuthTenantStrategy.getEntityData on the management server). The field stays
// free text so rules predating this list keep their value, but anything outside
// it can never match.
const RULE_PARAMETERS = [ 'email', 'name', 'ssoId', 'tenantId' ];

// The server stores the comparison and its inversion separately (method + negate),
// but a reader should not have to combine two controls in their head to work out
// what a rule means. The dialog offers both directions as one list and maps the
// choice back onto the two stored columns, so the data model is unchanged.
// The negated forms are no longer offered. On an access rule they only ever faked
// "allow everyone except", and that composed wrongly: two of them OR together and
// stop excluding anything. Block and Allow cover the same ground correctly.
//
// They stay in this list for DISPLAY. `negate` is still honoured by the server and
// remains a permanent part of Grant rules, where "grant to everyone except X" has
// no other spelling, so such a rule must keep reading correctly in the table and in
// the dialog rather than silently appearing as its opposite.
const CONDITIONS = [
	// The catch-all. It tests nothing, so the parameter and value fields are hidden
	// when it is chosen. It ranks below every real rule, which is how a tenant states
	// "refuse anyone no other rule mentions" as a row rather than a hidden default.
	{ id: 'anyone', method: 'anyone', negate: false, label: matchesAnyoneLabel },
	{ id: 'contains', method: 'contains', negate: false, label: containsLabel },
	{ id: 'notcontains', method: 'contains', negate: true, label: doesNotContainLabel },
	{ id: 'equals', method: 'equals', negate: false, label: equalsLabel },
	{ id: 'notequals', method: 'equals', negate: true, label: doesNotEqualLabel },
	{ id: 'startswith', method: 'startswith', negate: false, label: startswithLabel },
	{ id: 'notstartswith', method: 'startswith', negate: true, label: doesNotStartWithLabel },
	{ id: 'endswith', method: 'endswith', negate: false, label: endswithLabel },
	{ id: 'notendswith', method: 'endswith', negate: true, label: doesNotEndWithLabel },
];

// `type` is stored flat, but it answers two questions: which category of rule this
// is, and - for an access rule - whether it lets people in or keeps them out. The
// dialog asks them separately so a row never has to be decoded.
const CATEGORY_ACCESS = 'access';
const CATEGORY_GAIN = 'gain';

const ACCESS_EFFECTS = [
	{ id: 'block', label: blockLabel },
	{ id: 'allow', label: allowLabel },
];

const categoryOf = (type: string): string => (type === CATEGORY_GAIN ? CATEGORY_GAIN : CATEGORY_ACCESS);

const typeText = (type: unknown): string => {
	if (type === CATEGORY_GAIN) return gainLabel();
	const effect = ACCESS_EFFECTS.find((e) => e.id === type);

	// falls back to the raw value so a rule stored with an unrecognised type stays
	// visible rather than rendering as an empty cell
	return effect ? effect.label() : String(type ?? '');
};

const findCondition = (method: unknown, negate: unknown) =>
	CONDITIONS.find((c) => c.method === method && c.negate === Boolean(negate));

// Falls back to the raw stored method so a rule saved with an unrecognised
// comparison stays visible rather than rendering as an empty cell.
const conditionText = (method: unknown, negate: unknown): string =>
	findCondition(method, negate)?.label() ?? String(method ?? '');

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
				// shows Block / Allow / Grant rather than the stored discriminator.
				// accessorFn (not Cell) so search and column filters see what is shown.
				id: 'type',
				accessorFn: (row) => typeText(row.type),
				header: typeLablel()
			},
			{
				accessorKey: 'parameter',
				header: parameterLabel()
			},
			{
				// method and negate are one idea, so the list shows them as one phrase
				// ("does not end with") rather than a comparison plus a separate yes/no
				// column the reader has to combine. accessorFn (not Cell) so search and
				// column filters work on what is displayed.
				id: 'method',
				accessorFn: (row) => conditionText(row.method, row.negate),
				header: methodLabel()
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

	const conditionId = findCondition(method, negate)?.id ?? '';
	// the catch-all tests nothing, so it has no parameter and no value to show
	const isCatchAll = method === 'anyone';

	// Only the plain comparisons can be chosen. A rule written before the negated
	// forms were withdrawn keeps its own option in the list so that opening it
	// shows what it actually does, and leaving the field alone does not rewrite it.
	const conditionOptions = useMemo(() => CONDITIONS.filter((c) => {
		// whatever the rule already uses stays selectable, so opening an existing rule
		// never rewrites it just by being looked at
		if (c.id === conditionId) return true;
		if (c.negate) return false;

		// "matches anyone" only means something as a Block. As an Allow it is a no-op:
		// an unmatched user is permitted anyway, and it loses every tie to a Block.
		if (c.method === 'anyone' && type !== 'block') return false;

		return true;
	}), [ conditionId, type ]);

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
	const [ helpOpen, setHelpOpen ] = React.useState(false);

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

		// a new rule starts as an access rule that blocks, so the effect is never
		// left undecided and the stored type is always a real value
		setType('block');
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

	// Choosing the category sets the stored type; an access rule starts as a Block
	// so the effect is never left undecided.
	const handleCategoryChange = (event: { target: { value: string; }; }) => {
		setType(event.target.value === CATEGORY_GAIN ? CATEGORY_GAIN : 'block');
	};

	const handleEffectChange = (event: { target: { value: string; }; }) => {
		setType(event.target.value);

		// a catch-all only means something as a Block, so switching to Allow clears it
		// rather than leaving behind a rule that does nothing
		if (event.target.value !== 'block' && method === 'anyone') {
			setMethod('');
			setNegate(false);
		}
	};
	
	const handleParameterChange = (event: SyntheticEvent<Element, Event>, newValue: string) => {
		setParameter(newValue);
	};
	
	// One control, two stored columns
	const handleMethodChange = (event: { target: { value: string; }; }) => {
		const condition = CONDITIONS.find((c) => c.id === event.target.value);

		if (condition) {
			setMethod(condition.method);
			setNegate(condition.negate);

			// the catch-all tests nothing, so clear the fields it hides rather than
			// saving values the rule will never look at
			if (condition.method === 'anyone') {
				setParameter('');
				setValue('');
			}
		}
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
			<Dialog open={helpOpen} onClose={() => setHelpOpen(false)}>
				<DialogTitle>{rulesHelpTitleLabel()}</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ mb: 2 }}>{rulesHelpKindsLabel()}</DialogContentText>

					<DialogContentText sx={{ fontWeight: 'bold', mb: 1 }}>{accessLabel()}</DialogContentText>
					<DialogContentText sx={{ mb: 2 }}>{rulesHelpStepsLabel()}</DialogContentText>
					<DialogContentText sx={{ mb: 2 }}>{rulesHelpOpenLabel()}</DialogContentText>
					<DialogContentText sx={{ mb: 2 }}>{rulesHelpClosesLabel()}</DialogContentText>
					<DialogContentText sx={{ mb: 2 }}>{rulesHelpBlockLabel()}</DialogContentText>
					<DialogContentText sx={{ mb: 3, fontStyle: 'italic' }}>{rulesHelpAdminsLabel()}</DialogContentText>

					<DialogContentText sx={{ fontWeight: 'bold', mb: 1 }}>{gainLabel()}</DialogContentText>
					<DialogContentText sx={{ mb: 2 }}>{rulesHelpGrantLabel()}</DialogContentText>
					<DialogContentText sx={{ mb: 2 }}>{rulesHelpGrantKeepLabel()}</DialogContentText>
					<DialogContentText>{rulesHelpGrantAccessLabel()}</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setHelpOpen(false)}>{closeLabel()}</Button>
				</DialogActions>
			</Dialog>
			<Dialog open={open} onClose={handleClose}>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
					{manageItemLabel()}
					<IconButton onClick={() => setHelpOpen(true)} aria-label={rulesHelpTitleLabel()} size="small">
						<InfoOutlinedIcon />
					</IconButton>
				</DialogTitle>
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
							value={categoryOf(type)}
							label={typeLablel()}
							onChange={handleCategoryChange}
						>
							<MenuItem value={CATEGORY_ACCESS}>{accessLabel()}</MenuItem>
							<MenuItem value={CATEGORY_GAIN}>{gainLabel()}</MenuItem>
						</Select>
					</FormControl>
					{categoryOf(type) === CATEGORY_ACCESS &&
					<FormControl
						sx={{ marginTop: '8px' }}
						fullWidth>
						<InputLabel id="effect-label">{effectLabel()}</InputLabel>
						<Select
							required
							labelId="effect-label"
							id="effect"
							value={ACCESS_EFFECTS.some((e) => e.id === type) ? type : 'block'}
							label={effectLabel()}
							onChange={handleEffectChange}
						>
							{ACCESS_EFFECTS.map((e) =>
								<MenuItem key={e.id} value={e.id}>{e.label()}</MenuItem>
							)}
						</Select>
					</FormControl>
					}
					{!isCatchAll &&
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
					}

					<FormControl
						sx={{ marginTop: '8px' }}
						fullWidth>
						<InputLabel id="method-label">{methodLabel()}</InputLabel>
						<Select
							labelId="method-label"
							id="method"
							value={conditionId}
							label={methodLabel()}
							required
							onChange={handleMethodChange}
						>
							{conditionOptions.map((c) =>
								<MenuItem key={c.id} value={c.id}>{c.label()}</MenuItem>
							)}
						</Select>
					</FormControl>
					{!isCatchAll &&
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
					}
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
					// Always read the record, never the rendered cells. Several columns
					// display a derived label (tenant name, condition phrase), and
					// reading those back by column index has twice put the wrong value
					// into this dialog.
					const rule = row.original;
					// bigint columns arrive as strings from Postgres and numbers from
					// MySQL, so normalise rather than testing typeof
					const text = (v: unknown): string => (v == null ? '' : String(v));
					const ruleTenantId = rule.tenantId == null ? 0 : parseInt(text(rule.tenantId));

					setId(parseInt(text(rule.id)) || 0);
					setName(text(rule.name));

					setTenantId(Number.isNaN(ruleTenantId) ? 0 : ruleTenantId);
					setTenantIdOption(tenants.find((x) => sameId(x.id, rule.tenantId)));

					setType(text(rule.type));
					setParameter(text(rule.parameter));
					setMethod(text(rule.method));
					setNegate(Boolean(rule.negate));
					setValue(text(rule.value));
					setAction(text(rule.action));
					// stored as a string, but normalise so the group Select can match
					// its (stringified) option values and preselect the group
					setAccessId(text(rule.accessId));

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

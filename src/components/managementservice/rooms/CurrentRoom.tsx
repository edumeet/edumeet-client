import { SyntheticEvent, useEffect, useState } from 'react';
// eslint-disable-next-line camelcase
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, FormControlLabel, Checkbox, Autocomplete } from '@mui/material';
import { Roles, Room } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createRoom, getData, getRoomByName, patchData } from '../../../store/actions/managementActions';
import { claimRoomLabel, editRoomLabel } from '../../translated/translatedComponents';

const CurrentRoomModal = () => {
	const dispatch = useAppDispatch();

	/* type TenantOptionTypes = Array<Tenant> */

	/* const [ tenants, setTenants ] = useState<TenantOptionTypes>([ { 'id': 0, 'name': '', 'description': '' } ]); */

	type RoleTypes = Array<Roles>

	const [ roomExists, setRoomExists ] = useState(false);
	const [ roles, setRoles ] = useState<RoleTypes>([ { 'description': 'Test', 'id': 1, 'name': 'Test', 'tenantId': 1, 'permissions': [] } ]);
	const [ id, setId ] = useState(0);
	const [ name, setName ] = useState('');
	const nameDisabled =false;
	const [ description, setDescription ] = useState('');
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
	const [ tenantId, setTenantId ] = useState(0);
	const [ defaultRoleId, setDefaultRoletId ] = useState(0);

	const [ breakoutsEnabled, setBreakoutsEnabled ] = useState(false);
	const [ logo, setLogo ] = useState('');
	const [ background, setBackground ] = useState('');
	const [ maxActiveVideos, setMaxActiveVideos ] = useState(0);
	const [ locked, setLocked ] = useState(false);
	const [ chatEnabled, setChatEnabled ] = useState(false);
	const [ raiseHandEnabled, setRaiseHandEnabled ] = useState(false);
	const [ filesharingEnabled, setFilesharingEnabled ] = useState(false);
	const [ localRecordingEnabled, setLocalRecordingEnabled ] = useState(false);
	
	/* const [ tenantIdOption, setTenantIdOption ] = useState<Tenant | undefined>(); */
	const [ defaultRoleIdOption, setDefaultRoleIdOption ] = useState<Roles | undefined>();

	const [ cantPatch ] = useState(false);

	async function fetchProduct() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		/* dispatch(getData('tenants')).then((tdata: any) => {
			if (tdata != undefined) {
				setTenants(tdata.data);
			}
		}); */

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('roles')).then((tdata: any) => {
			if (tdata != undefined) {
				setRoles(tdata.data);
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getRoomByName(window.location.pathname.substring(1))).then((tdata: any) => {
			
			const r = tdata.data[0] as Room;

			const tid = r.id;
			const tname=r.name;
			const tdescription=r.description;
			const tdefaultroleId=r.defaultRoleId;
			const ttenantId=r.tenantId;
			const tlogo=r.logo;
			const tbackground=r.background;
			const tmaxActiveVideos=r.maxActiveVideos;
			const tlocked=r.locked;
			const tchatEnabled=r.chatEnabled;
			const traiseHandEnabled=r.raiseHandEnabled;
			const tfilesharingEnabled=r.filesharingEnabled;
			const tlocalRecordingEnabled=r.localRecordingEnabled;
			const tbreakoutsEnabled=r.breakoutsEnabled;

			if (typeof tid === 'number') {
				setId(tid);
			}
			if (typeof tname === 'string') {
				setName(tname);
			} else {
				setName('');
			}
			if (typeof tdescription === 'string') {
				setDescription(tdescription);
			} else {
				setDescription('');
			}

			if (typeof tdefaultroleId === 'string') {
				const tdefaultrole = roles.find((x) => x.id === parseInt(tdefaultroleId));

				if (tdefaultrole) {
					setDefaultRoleIdOption(tdefaultrole);
				} else {
					setDefaultRoleIdOption(undefined);
				}
				setDefaultRoletId(parseInt(tdefaultroleId));
			} else {
				setDefaultRoletId(0);
				setDefaultRoleIdOption(undefined);
			}
			if (typeof ttenantId === 'string') {
				/* const ttenant = tenants.find((x) => x.id === parseInt(ttenantId));

				if (ttenant) {
					setTenantIdOption(ttenant);
				} */
				setTenantId(parseInt(ttenantId));
			} else {
				setTenantId(0);
			}

			if (typeof tlogo === 'string') {
				setLogo(tlogo);
			} else {
				setLogo('');
			}
			if (typeof tbackground === 'string') {
				setBackground(tbackground);
			} else {
				setBackground('');
			}
			if (typeof tmaxActiveVideos === 'number') {
				setMaxActiveVideos(tmaxActiveVideos);
			} else {
				setMaxActiveVideos(0);
			}

			if (tlocked === true) {
				setLocked(true);
			} else {
				setLocked(false);
			}
			if (tchatEnabled === true) {
				setChatEnabled(true);
			} else {
				setChatEnabled(false);
			}
			if (traiseHandEnabled === true) {
				setRaiseHandEnabled(true);
			} else {
				setRaiseHandEnabled(false);
			}
			if (tfilesharingEnabled === true) {
				setFilesharingEnabled(true);
			} else {
				setFilesharingEnabled(false);
			}
			if (tlocalRecordingEnabled === true) {
				setLocalRecordingEnabled(true);
			} else {
				setLocalRecordingEnabled(false);
			}
			if (tbreakoutsEnabled === true) {
				setBreakoutsEnabled(true);
			} else {
				setBreakoutsEnabled(false);
			}
	
			setOpen(true);
            
		});

	}

	function checkRoomExists() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getRoomByName(window.location.pathname.substring(1))).then((tdata: any) => {
			setRoomExists(tdata.total===1);
		});
	}

	useEffect(() => {
		// fetchProduct();
		checkRoomExists();
	}, []);
	
	const [ open, setOpen ] = useState(false);

	const handleNameChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setName(event.target.value);
	};
	const handleDescriptionChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setDescription(event.target.value);
	};

	const handleDefaultRoleIdChange = (event: SyntheticEvent<Element, Event>, newValue: Roles) => {
		if (newValue) {
			setDefaultRoletId(newValue.id);
			setDefaultRoleIdOption(newValue);
		}
	};

	const handleLogoChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setLogo(event.target.value);
	};
	const handleBackgroundChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setBackground(event.target.value);
	};
	const handleMaxActiveVideosChange = (event: { target: { value: string; }; }) => {
		setMaxActiveVideos(parseInt(event.target.value));
	};
	const handleLockedChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setLocked(event.target.checked);
	};
	const handleChatEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setChatEnabled(event.target.checked);
	};
	const handleRaiseHandEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setRaiseHandEnabled(event.target.checked);
	};
	const handleFilesharingEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setFilesharingEnabled(event.target.checked);
	};
	const handleLocalRecordingEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setLocalRecordingEnabled(event.target.checked);
	};
	const handleBreakoutsEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setBreakoutsEnabled(event.target.checked);
	};
	const handleClose = () => {
		setOpen(false);
	};
	const handleOpen = () => {
		fetchProduct();
	};
	const handleCreateRoom = () => {
		dispatch(createRoom(window.location.pathname.substring(1))).then(() => {
			checkRoomExists();
		});
	};

	const addTenant = async () => {

		const obj : Room= {
			description: description,
			logo: logo,
			background: background,
			maxActiveVideos: maxActiveVideos,
			locked: locked,
			chatEnabled: chatEnabled,
			raiseHandEnabled: raiseHandEnabled,
			filesharingEnabled: filesharingEnabled,
			localRecordingEnabled: localRecordingEnabled,
			breakoutsEnabled: breakoutsEnabled,
		};
			
		if (defaultRoleId) {
			obj.defaultRoleId=defaultRoleId;
		}
		dispatch(patchData(id, obj, 'rooms')).then(() => {
			setOpen(false);
		});

	};

	return <>
		<Dialog open={open} onClose={handleClose}>
			<DialogTitle>Add/Edit</DialogTitle>
			<DialogContent>
				<DialogContentText>
						These are the parameters that you can change.
				</DialogContentText>
				<input type="hidden" name="id" value={id} />
				<TextField
					autoFocus
					margin="dense"
					id="name"
					label="name"
					type="text"
					required
					fullWidth
					onChange={handleNameChange}
					value={name}
					disabled={nameDisabled}
				/>
				<TextField
					autoFocus
					margin="dense"
					id="description"
					label="description"
					type="text"
					required
					fullWidth
					onChange={handleDescriptionChange}
					value={description}
				/>
				{/* <TextField
						autoFocus
						margin="dense"
						id="tenantId"
						label="tenantId"
						type="number"
						disabled
						required
						fullWidth
						onChange={handleTenantIdChange}
						value={tenantId}
					/> */}
				<Autocomplete
					options={roles}
					getOptionLabel={(option) => option.name}
					fullWidth
					disableClearable
					onChange={handleDefaultRoleIdChange}
					value={defaultRoleIdOption}
					sx={{ marginTop: '8px' }}
					renderInput={(params) => <TextField {...params} label="Default Role" />}
				/>
				{/* <Autocomplete
					options={tenants}
					getOptionLabel={(option) => option.name}
					fullWidth
					disableClearable
					readOnly
					// onChange={handleTenantIdChange}
					value={tenantIdOption}
					sx={{ marginTop: '8px' }}
					renderInput={(params) => <TextField {...params} label="Tenant" />}
				/> */}
				<TextField
					autoFocus
					margin="dense"
					id="logo"
					label="logo"
					type="text"
					required
					fullWidth
					onChange={handleLogoChange}
					value={logo}
				/>
				<TextField
					autoFocus
					margin="dense"
					id="background"
					label="background"
					type="text"
					required
					fullWidth
					onChange={handleBackgroundChange}
					value={background}
				/>
				<TextField
					autoFocus
					margin="dense"
					id="maxActiveVideos"
					label="maxActiveVideos"
					type="number"
					required
					fullWidth
					onChange={handleMaxActiveVideosChange}
					value={maxActiveVideos}
				/>
				<FormControlLabel control={<Checkbox checked={locked} onChange={handleLockedChange} />} label="locked" />
				<FormControlLabel control={<Checkbox checked={chatEnabled} onChange={handleChatEnabledChange} />} label="chatEnabled" />
				<FormControlLabel control={<Checkbox checked={raiseHandEnabled} onChange={handleRaiseHandEnabledChange} />} label="raiseHandEnabled" />
				<FormControlLabel control={<Checkbox checked={filesharingEnabled} onChange={handleFilesharingEnabledChange} />} label="filesharingEnabled" />
				<FormControlLabel control={<Checkbox checked={localRecordingEnabled} onChange={handleLocalRecordingEnabledChange} />} label="localRecordingEnabled" />
				<FormControlLabel control={<Checkbox checked={breakoutsEnabled} onChange={handleBreakoutsEnabledChange} />} label="breakoutsEnabled" />
					
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>Cancel</Button>
				<Button onClick={addTenant} disabled={cantPatch}>OK</Button>
			</DialogActions>
		</Dialog>
		<div style={{ margin: 'auto', textAlign: 'center' }}>
			<Button onClick={ roomExists ? handleOpen : handleCreateRoom}>{ roomExists ? editRoomLabel():claimRoomLabel()}</Button>				
		</div>

	</>;
};

export default CurrentRoomModal;

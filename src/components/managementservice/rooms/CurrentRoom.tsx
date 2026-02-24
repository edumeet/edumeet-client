import { SyntheticEvent, useEffect, useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, FormControlLabel, Checkbox, Autocomplete } from '@mui/material';
import { Roles, Room } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createRoom, getData, getRoomByName, patchData } from '../../../store/actions/managementActions';
import { applyLabel, breakoutsEnabledLabel, cancelLabel, chatEnabledLabel, claimRoomLabel, defaultLabel, descLabel, editRoomLabel, filesharingEnabledLabel, genericItemDescLabel, localRecordingEnabledLabel, lockRoomLabel, logoLabel, manageItemLabel, maxActiveVideosLabel, nameLabel, raiseHandEnabledLabel, reactionsEnabledLabel, roleLabel, roomBgLabel } from '../../translated/translatedComponents';
import { Logger } from '../../../utils/Logger';

const logger = new Logger('CurrentRoom');

const CurrentRoomModal = () => {
	const dispatch = useAppDispatch();

	/* type TenantOptionTypes = Array<Tenant> */

	/* const [ tenants, setTenants ] = useState<TenantOptionTypes>([ { 'id': 0, 'name': '', 'description': '' } ]); */

	type RoleTypes = Array<Roles>

	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);

	const [ roomExists, setRoomExists ] = useState<boolean | null>(null);
	const [ roles, setRoles ] = useState<RoleTypes>([ { 'description': 'Test', 'id': 1, 'name': 'Test', 'tenantId': 1, 'permissions': [] } ]);
	const [ id, setId ] = useState(0);
	const [ name, setName ] = useState('');
	const nameDisabled = true;
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
	const [ reactionsEnabled, setReactionsEnabled ] = useState(false);
	const [ filesharingEnabled, setFilesharingEnabled ] = useState(false);
	const [ localRecordingEnabled, setLocalRecordingEnabled ] = useState(false);

	const [ managementConnectionError, setManagementConnectionError ] = useState(false);

	/* const [ tenantIdOption, setTenantIdOption ] = useState<Tenant | undefined>(); */
	const [ defaultRoleIdOption, setDefaultRoleIdOption ] = useState<Roles | undefined>();

	const [ cantPatch ] = useState(false);

	async function fetchProduct() {
		/* dispatch(getData('tenants')).then((tdata: any) => {
			if (tdata != undefined) {
				setTenants(tdata.data);
			}
		}); */

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('roles')).then((tdat: any) => {
			if (tdat != undefined) {
				setRoles(tdat.data);
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(getRoomByName(window.location.pathname.substring(1).toLowerCase())).then((tdata: any) => {

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
				const treactionsEnabled=r.reactionsEnabled;
				const tfilesharingEnabled=r.filesharingEnabled;
				const tlocalRecordingEnabled=r.localRecordingEnabled;
				const tbreakoutsEnabled=r.breakoutsEnabled;

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
				if (typeof tdescription === 'string') {
					setDescription(tdescription);
				} else {
					setDescription('');
				}

				if (typeof tdefaultroleId === 'number') {
					const tdefaultrole = tdat.data.find((x: { id: number; }) => x.id == tdefaultroleId);

					if (tdefaultrole) {
						setDefaultRoleIdOption(tdefaultrole);
					} else {
						setDefaultRoleIdOption(undefined);
					}
					setDefaultRoletId(tdefaultroleId);
				} else if (typeof tdefaultroleId === 'string') {
					const tdefaultrole = tdat.data.find((x: { id: number; }) => x.id == parseInt(tdefaultroleId));

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
				if (typeof ttenantId === 'number') {
					setTenantId(ttenantId);
				} else if (typeof ttenantId === 'string') {
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
				if (treactionsEnabled === true) {
					setReactionsEnabled(true);
				} else {
					setReactionsEnabled(false);
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

			})
				.catch((error) => {
					setManagementConnectionError(true);
					logger.warn('fetchProduct() error calling getRoomByName [error: %o]', error);
				});
		});

	}

	function checkRoomExists() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getRoomByName(window.location.pathname.substring(1).toLowerCase())).then((tdata: any) => {
			setRoomExists(tdata?.total === 1);
			setManagementConnectionError(false);
		})
			.catch((error) => {
				setManagementConnectionError(true);
				logger.warn('checkRoomExists() error calling getRoomByName [error: %o]', error);
			});
	}

	const isLoadingRoomExists = roomExists === null;

	useEffect(() => {
		if (!loggedIn) return;

		// fetchProduct();
		checkRoomExists();
	}, [ loggedIn ]);

	const [ open, setOpen ] = useState(false);

	const handleNameChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setName(event.target.value);
	};
	const handleDescriptionChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setDescription(event.target.value);
	};

	const handleDefaultRoleIdChange = (event: SyntheticEvent<Element, Event>, newValue: Roles) => {
		if (newValue) {
			if (typeof newValue.id != 'number') {
				setDefaultRoletId(parseInt(newValue.id));
			} else {
				setDefaultRoletId(newValue.id);
			}
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
	const handleReactionsEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setReactionsEnabled(event.target.checked);
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
		dispatch(createRoom(window.location.pathname.substring(1).toLowerCase())).then(() => {
			checkRoomExists();
		})
			.catch((error) => {
				setManagementConnectionError(true);
				logger.warn('handleCreateRoom() error calling createRoom [error: %o]', error);
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
			reactionsEnabled: reactionsEnabled,
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
					disabled={nameDisabled}
				/>
				<TextField
					autoFocus
					margin="dense"
					id="description"
					label={descLabel()}
					type="text"
					required
					fullWidth
					onChange={handleDescriptionChange}
					value={description}
				/>
				<Autocomplete
					options={roles}
					getOptionLabel={(option) => option.name}
					fullWidth
					disableClearable
					onChange={handleDefaultRoleIdChange}
					value={defaultRoleIdOption}
					sx={{ marginTop: '8px' }}
					renderInput={(params) => <TextField {...params} label={`${defaultLabel()} ${roleLabel()}`} />}
				/>
				<TextField
					autoFocus
					margin="dense"
					id="logo"
					label={logoLabel()}
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
					label={roomBgLabel()}
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
					label={maxActiveVideosLabel()}
					type="number"
					required
					fullWidth
					onChange={handleMaxActiveVideosChange}
					value={maxActiveVideos}
				/>
				<FormControlLabel control={<Checkbox checked={locked} onChange={handleLockedChange} />} label={lockRoomLabel()} />
				<FormControlLabel control={<Checkbox checked={chatEnabled} onChange={handleChatEnabledChange} />} label={chatEnabledLabel()} />
				<FormControlLabel control={<Checkbox checked={raiseHandEnabled} onChange={handleRaiseHandEnabledChange} />} label={raiseHandEnabledLabel()} />
				<FormControlLabel control={<Checkbox checked={reactionsEnabled} onChange={handleReactionsEnabledChange} />} label={reactionsEnabledLabel()} />
				<FormControlLabel control={<Checkbox checked={filesharingEnabled} onChange={handleFilesharingEnabledChange} />} label={filesharingEnabledLabel()} />
				<FormControlLabel control={<Checkbox checked={localRecordingEnabled} onChange={handleLocalRecordingEnabledChange} />} label={localRecordingEnabledLabel()} />
				<FormControlLabel control={<Checkbox checked={breakoutsEnabled} onChange={handleBreakoutsEnabledChange} />} label={breakoutsEnabledLabel()} />
					
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>{cancelLabel()}</Button>
				<Button onClick={addTenant} disabled={cantPatch}>{applyLabel()}</Button>
			</DialogActions>
		</Dialog>
		<div style={{ margin: 'auto', textAlign: 'center' }}>
			<Button
				disabled={isLoadingRoomExists || managementConnectionError }
				onClick={roomExists ? handleOpen : handleCreateRoom}
			>
				{isLoadingRoomExists ? '...' : (roomExists ? editRoomLabel() : claimRoomLabel())}
			</Button>
		</div>
	</>;
};

export default CurrentRoomModal;

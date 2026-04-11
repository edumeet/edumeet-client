import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LogoutIcon from '@mui/icons-material/Logout';
import TenantTable from '../../components/managementservice/tenants/Tenant';
import { useEffect, useState } from 'react';
import RoomTable from '../../components/managementservice/rooms/Room';
import GroupTable from '../../components/managementservice/groups/Groups';
import UserTable from '../../components/managementservice/users/Users';
import RoleTable from '../../components/managementservice/role/Role';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { getUserData, startMGMTListeners, stopMGMTListeners } from '../../store/actions/managementActions';
import { useAppDispatch, useAppSelector, useNotifier } from '../../store/hooks';
import TenantAdminTable from '../../components/managementservice/tenants/TenantAdmin';
import TenantOwnerTable from '../../components/managementservice/tenants/TenantOwner';
import { checkJWT, logout } from '../../store/actions/permissionsActions';
import { managamentActions } from '../../store/slices/managementSlice';
import SignIn from '../../components/settingsdialog/managementsettings/ManagementAdminLoginSettings';
import GroupRoleTable from '../../components/managementservice/groups/GroupRole';
import GroupUserTable from '../../components/managementservice/groups/GroupUser';
import RuleTable from '../../components/managementservice/rules/Rule';
import RuleIcon from '@mui/icons-material/Rule';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import { chooseComponentLabel, defaultSettingsLabel, defaultsLabel, edumeetManagementClientLabel, groupRolesLabel, groupsLabel, groupUsersLabel, logoutLabel, rolesLabel, roomSettingsLabel, roomsLabel, rulesLabel, tenantSettingsLabel, tenantsLabel, usersLabel } from '../../components/translated/translatedComponents';
import DefaultTable from '../../components/managementservice/defaults/Defaults';

const drawerWidth = 300;

export default function ManagementUI(/* props: Props */) {
	useNotifier();
	const dispatch = useAppDispatch();

	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const { username, tenantAdmin, tenantOwner, superAdmin } = useAppSelector((state) => state.management);
	const canManageTenant = tenantOwner || tenantAdmin || superAdmin;

	const [ mobileOpen, setMobileOpen ] = useState(false);

	const handleDrawerToggle = () => {
		setMobileOpen((prev) => !prev);
	};

	const [ selectedComponent, setSelectedComponent ] = useState('');

	useEffect(() => {
		dispatch(startMGMTListeners());

		dispatch(checkJWT());

		return () => {
			dispatch(stopMGMTListeners());
		};
	}, []);

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getUserData()).then((tdata: any) => {
			if (tdata) {
				if (tdata.user.name!=null && tdata.user.name !='') {
					dispatch(managamentActions.setUsername(tdata.user.name));
				} else {
					dispatch(managamentActions.setUsername(tdata.user.email));
				}
				if (tdata.user.email)
					dispatch(managamentActions.setEmail(tdata.user.email));
				if (tdata.user.avatar)
					dispatch(managamentActions.setAvatar(tdata.user.avatar));
				if (tdata.user.tenantAdmin)
					dispatch(managamentActions.setTenantAdmin(tdata.user.tenantAdmin));
				if (tdata.user.tenantOwner)
					dispatch(managamentActions.setTenantOwner(tdata.user.tenantOwner));
				if (tdata.user.roles) {
					dispatch(managamentActions.setSuperAdmin(tdata.user.roles.includes('super-admin')));
				} else {
					dispatch(managamentActions.setSuperAdmin(false));
				}			
			}
		});
	}, [ loggedIn ]);

	// Function to render the selected component in the placeholder
	const renderComponent = () => {
		if (loggedIn) {
			switch (selectedComponent) {
				case 'login':
					return <div style={{ minWidth: '400px' }}>
						<SignIn />
					</div>;
				case 'default':
					return <>
						{defaultSettingsLabel()}
						<DefaultTable />
					</>;
				case 'tenant':
					return <>
						{tenantSettingsLabel()}
						<TenantTable />
						<TenantOwnerTable />
						<TenantAdminTable />
					</>;
				case 'room':
					return <>
						{roomSettingsLabel()}
						<RoomTable />
					</>;
				case 'user':
					return <>
						{usersLabel()}
						<UserTable />
					</>;
				case 'group':
					return <>
						{groupsLabel()}
						<GroupTable />
						{groupRolesLabel()}
						<GroupRoleTable />
						{groupUsersLabel()}
						<GroupUserTable />
					</>;
				case 'role':
					return <>
						{rolesLabel()}
						<RoleTable />
					</>;
				case 'rule':
					return <>
						{rulesLabel()}
						<RuleTable />
					</>;
				default:
					return <Box sx={{ minWidth: '400px' }}>{ chooseComponentLabel() }</Box>;
			}
		} else {
			return <SignIn />;
		}
	};

	const drawer = (
		<div>
			<List>
				<ListItem style={{ justifyContent: 'center' }} >
					<img src='/images/logo.edumeet.svg' alt='logo' />
				</ListItem>
			</List>

			{ loggedIn && <>
				<List>
					<ListItem key={'{username}'} disablePadding onClick={
						() => { if (!loggedIn) { setSelectedComponent('login'); } }
					}>
						<ListItemButton>
							<ListItemIcon>
								<PersonOutlineIcon/>
							</ListItemIcon>
							<ListItemText primary={username} />
						</ListItemButton>
					</ListItem>
					<ListItem key={'Logout'} disablePadding onClick={
						async () => {
							dispatch(logout()).then(() => {
								window.location.reload();	
							});
						}
					}>
						<ListItemButton>
							<ListItemIcon>
								<LogoutIcon />
							</ListItemIcon>
							<ListItemText primary={logoutLabel()} />
						</ListItemButton>
					</ListItem>
				</List>

				<Divider />

				<List>
					{canManageTenant && (
						<ListItem key={'Tenants'} disablePadding onClick={() => setSelectedComponent('tenant')}>
							<ListItemButton>
								<ListItemIcon>
									<PeopleOutlineIcon />
								</ListItemIcon>
								<ListItemText primary={tenantsLabel()} />
							</ListItemButton>
						</ListItem>
					)}
					{canManageTenant && (
						<ListItem key={'Rule(s)'} disablePadding onClick={
							() => setSelectedComponent('rule')
						}>
							<ListItemButton >
								<ListItemIcon>
									<RuleIcon />
								</ListItemIcon>
								<ListItemText primary={rulesLabel()} />
							</ListItemButton>
						</ListItem>
					)}
					{canManageTenant && (
						<ListItem key={'Default(s)'} disablePadding onClick={
							() => setSelectedComponent('default')
						}>
							<ListItemButton >
								<ListItemIcon>
									<SettingsApplicationsIcon />
								</ListItemIcon>
								<ListItemText primary={defaultsLabel()} />
							</ListItemButton>
						</ListItem>
					)}
					<ListItem key={'Room(s)'} disablePadding onClick={() => setSelectedComponent('room')}>
						<ListItemButton>
							<ListItemIcon>
								<MeetingRoomIcon />
							</ListItemIcon>
							<ListItemText primary={roomsLabel()} />
						</ListItemButton>
					</ListItem>
					<ListItem key={'User(s)'} disablePadding onClick={
						() => setSelectedComponent('user')
					}>
						<ListItemButton >
							<ListItemIcon>
								<PersonSearchIcon />
							</ListItemIcon>
							<ListItemText primary={usersLabel()} />
						</ListItemButton>
					</ListItem>
					{canManageTenant && (
						<ListItem key={'Group(s)'} disablePadding onClick={
							() => setSelectedComponent('group')
						}>
							<ListItemButton >
								<ListItemIcon>
									<SupervisorAccountIcon />
								</ListItemIcon>
								<ListItemText primary={groupsLabel()} />
							</ListItemButton>
						</ListItem>
					)}
					<ListItem key={'Role(s)'} disablePadding onClick={
						() => setSelectedComponent('role')
					}>
						<ListItemButton >
							<ListItemIcon>
								<AdminPanelSettingsIcon />
							</ListItemIcon>
							<ListItemText primary={rolesLabel()} />
						</ListItemButton>
					</ListItem>
					
				</List>

				<Divider />
			</>
			}
		</div >
	);

	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);

	if (localeInProgress) {
		return null;
	}

	return (
		<Box sx={{ display: 'flex', flex: 1, marginRight: { sm: '0px' } }}>
			<CssBaseline />
			<AppBar
				position="fixed"
				style={{ backgroundColor: '#9C298C' }}
				sx={{
					width: { sm: `calc(100% - ${drawerWidth}px)` },
					ml: { sm: `${drawerWidth}px` },
				}}
			>
				<Toolbar>
					<IconButton
						color="inherit"
						aria-label="open drawer"
						edge="start"
						onClick={handleDrawerToggle}
						sx={{ mr: 2, display: { sm: 'none' } }}
					>
						<MenuIcon />
					</IconButton>
					<Typography variant="h6" noWrap component="div">
						{edumeetManagementClientLabel()}
					</Typography>
				</Toolbar>
			</AppBar>
			<Box
				component="nav"
				sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
				aria-label="mailbox folders"
			>
				<Drawer

					variant="temporary"
					open={mobileOpen}
					onClose={handleDrawerToggle}
					ModalProps={{
						keepMounted: true, // Better open performance on mobile.
					}}
					sx={{
						display: { xs: 'block', sm: 'none' },
						'& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
					}}
				>
					{drawer}
				</Drawer>
				<Drawer
					variant="permanent"
					sx={{
						display: { xs: 'none', sm: 'block' },
						'& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
					}}
					open
				>
					{drawer}
				</Drawer>
			</Box>
			<Box
				component="main"
				sx={{ flexGrow: 1, p: 1, width: 'calc(100% - 300px)' }}
			>
				<Toolbar />
				<div style={{ background: 'white', padding: '2px', maxWidth: '100%', minWidth: '300px' }}>
					{renderComponent()}
				</div>
			</Box>
		</Box>
	);
}

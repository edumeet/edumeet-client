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
import TenantFQDNTable from '../../components/managementservice/tenants/TenatnFQDN';
import TenantOAuthTable from '../../components/managementservice/tenants/TenantOAuth';
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
import { getUserData } from '../../store/actions/managementActions';
import { useAppDispatch, useAppSelector, useNotifier } from '../../store/hooks';
import PermissionTable from '../../components/managementservice/permisssion/Permission';
import InfoIcon from '@mui/icons-material/Info';
import TenantAdminTable from '../../components/managementservice/tenants/TenantAdmin';
import TenantOwnerTable from '../../components/managementservice/tenants/TenantOwner';
import { checkJWT, logout } from '../../store/actions/permissionsActions';
import SignIn from '../../components/settingsdialog/managementsettings/ManagementAdminLoginSettings';
import { startMGMTListeners, stopMGMTListeners } from '../../store/actions/mgmtActions';
import RoomOwnerTable from '../../components/managementservice/rooms/RoomOwner';
import GroupRoleTable from '../../components/managementservice/groups/GroupRole';
import GroupUserTable from '../../components/managementservice/groups/GroupUser';
import RoomUserRoleTable from '../../components/managementservice/rooms/roomUserRole';

const drawerWidth = 300;

export default function ManagementUI(/* props: Props */) {
	useNotifier();
		
	const dispatch = useAppDispatch();
	
	const [ mobileOpen, setMobileOpen ] = useState(false);

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen);
	};

	const [ selectedComponent, setSelectedComponent ] = useState('');
	const [ username, setUsername ] = useState('');
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);

	useEffect(() => {
		dispatch(startMGMTListeners());

		dispatch(checkJWT()).then(() => {
		});

		return () => {
			dispatch(stopMGMTListeners());
		};
	}, []);
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getUserData()).then((tdata: any) => {
			if (tdata) {
				setUsername(tdata.user.email);				
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
				case 'tenant':
					return <>
						<TenantTable />
						<TenantFQDNTable />
						<TenantOAuthTable />
						<TenantOwnerTable />
						<TenantAdminTable />
					</>;
				case 'tenant-fqdn':
					return <TenantFQDNTable />;
				case 'tenant-oauth':
					return <TenantOAuthTable />;
				case 'room':
					return <>
						<RoomOwnerTable />
						<RoomTable />
						<RoomUserRoleTable />
					</>;

				case 'user':
					return <UserTable />;
				case 'group':
					return <>
						<GroupTable />
						<GroupRoleTable />
						<GroupUserTable />
					</>;
				case 'role':
					return <RoleTable />;
				case 'permission':
					return <PermissionTable />;
				default:
					return <Box sx={{ minWidth: '400px' }}>Select an item to load a component </Box>;
			}
		} else {
			return <SignIn />;
		}
	};

	const drawer = (
		<div>
			<List>
				<ListItem style={{ justifyContent: 'center' }} >
					<img src='/images/logo.edumeet.svg' />
				</ListItem>
			
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
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						dispatch(logout()).then(() => {
							window.location.reload();	
						});
					}
				}>
					<ListItemButton>
						<ListItemIcon>
							<LogoutIcon />
						</ListItemIcon>
						<ListItemText primary={'Logout'} />
					</ListItemButton>
				</ListItem>

			</List>

			<Divider />
			<List>
				<ListItem key={'Permissions'} disablePadding onClick={
					() => setSelectedComponent('permission')
				}>
					<ListItemButton >
						<ListItemIcon>
							<InfoIcon />
						</ListItemIcon>
						<ListItemText primary={'Permissions'} />
					</ListItemButton>
				</ListItem>
				<ListItem key={'Tenants'} disablePadding onClick={
					() => setSelectedComponent('tenant')
				}>
					<ListItemButton >
						<ListItemIcon>
							<PeopleOutlineIcon />
						</ListItemIcon>
						<ListItemText primary={'Tenants'} />
					</ListItemButton>
				</ListItem>
				<ListItem key={'Room(s)'} disablePadding onClick={
					() => setSelectedComponent('room')
				}>
					<ListItemButton >
						<ListItemIcon>
							<MeetingRoomIcon />
						</ListItemIcon>
						<ListItemText primary={'Room(s)'} />
					</ListItemButton>
				</ListItem>
				<ListItem key={'User(s)'} disablePadding onClick={
					() => setSelectedComponent('user')
				}>
					<ListItemButton >
						<ListItemIcon>
							<PersonSearchIcon />
						</ListItemIcon>
						<ListItemText primary={'Users'} />
					</ListItemButton>
				</ListItem>
				<ListItem key={'Group(s)'} disablePadding onClick={
					() => setSelectedComponent('group')
				}>
					<ListItemButton >
						<ListItemIcon>
							<SupervisorAccountIcon />
						</ListItemIcon>
						<ListItemText primary={'Groups'} />
					</ListItemButton>
				</ListItem>
				<ListItem key={'Role(s)'} disablePadding onClick={
					() => setSelectedComponent('role')
				}>
					<ListItemButton >
						<ListItemIcon>
							<AdminPanelSettingsIcon />
						</ListItemIcon>
						<ListItemText primary={'Role(s)'} />
					</ListItemButton>
				</ListItem>
			</List>
			<Divider />
		</div >
	);

	return (
		<>

			<Box sx={{ display: 'flex', flex: 1, marginRight: '300px' }}>
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
							Edumeet management client
						</Typography>
					</Toolbar>
				</AppBar>
				<Box
					component="nav"
					sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
					aria-label="mailbox folders"
				>
					{/* The implementation can be swapped with js to avoid SEO duplication of links. */}
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
					
					sx={{ flexGrow: 1, p: 1, width: { xs: 'calc(100%)', sm: 'calc(100%)' } }}
				>
					<Toolbar />
					<div style={{ background: 'white', padding: '2px', maxWidth: '100%', minWidth: '300px' }}>
						{renderComponent()}
					</div>

				</Box>

			</Box>
		</>
	);
}

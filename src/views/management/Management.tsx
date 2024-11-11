import * as React from 'react';
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
import { useAppDispatch } from '../../store/hooks';
import PermissionTable from '../../components/managementservice/permisssion/Permission';
import InfoIcon from '@mui/icons-material/Info';

/* import InboxIcon from '@mui/icons-material/MoveToInbox'; */
/* import MailIcon from '@mui/icons-material/Mail'; */

const drawerWidth = 300;

export default function ManagementUI(/* props: Props */) {
	const dispatch = useAppDispatch();
	
	const [ mobileOpen, setMobileOpen ] = React.useState(false);

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen);
	};

	const [ selectedComponent, setSelectedComponent ] = useState('');
	const [ username, setUsername ] = useState('');

	useEffect(() => {

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getUserData()).then((tdata: any) => {
			if (tdata) {
				setUsername(tdata.user.email);				
			}
		});
	
	}, []);

	// Function to render the selected component in the placeholder
	const renderComponent = () => {
		switch (selectedComponent) {
			case 'tenant':
				return <>
					<TenantTable />
					<TenantFQDNTable />
					<TenantOAuthTable />
				</>;
			case 'tenant-fqdn':
				return <TenantFQDNTable />;
			case 'tenant-oauth':
				return <TenantOAuthTable />;
			case 'room':
				return <RoomTable />;
			case 'user':
				return <UserTable />;
			case 'group':
				return <GroupTable />;
			case 'role':
				return <RoleTable />;
			case 'permission':
				return <PermissionTable />;
			default:
				return <div style={{ padding: '18px' }}>Select an item to load a component</div>;
		}
	};

	const drawer = (
		<div>
			{/* <Toolbar /> */}

			<List>
				<ListItem style={{ justifyContent: 'center' }} >
					<img src='/images/logo.edumeet.svg' />
				</ListItem>
			
				<ListItem key={'{username}'} disablePadding >

					<ListItemButton>
						<ListItemIcon>
							<PersonOutlineIcon/>
						</ListItemIcon>
						<ListItemText primary={`${username}`} />
					</ListItemButton>
				</ListItem>
				<ListItem key={'Logout'} disablePadding onClick={
					async () => {
						window.location.reload();
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
			{/* <List>
				{[ 'General', 'Logs', 'About us' ].map((text, index) => (
					<ListItem key={text} disablePadding>
						<ListItemButton>
							<ListItemIcon>
								{index % 2 === 0 ? <InfoIcon /> : <MailIcon />}
							</ListItemIcon>
							<ListItemText primary={text} />
						</ListItemButton>
					</ListItem>
				))}
			</List> */}
		</div >
	);

	return (
		<>

			<Box sx={{ display: 'flex', flex: 1, marginRight: '300px' }}>
				<CssBaseline />
				<AppBar
					position="fixed"
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
					sx={{ flexGrow: 1, p: 1, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
				>
					<Toolbar />
					<div style={{ background: 'white', padding: '2px' }}>
						{renderComponent()}
					</div>

				</Box>

			</Box>
		</>
	);
}

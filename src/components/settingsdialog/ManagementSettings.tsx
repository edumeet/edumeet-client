import { useEffect, useState } from 'react';
import { getUserData } from '../../store/actions/managementActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import CurrentRoomModal from '../managementservice/rooms/CurrentRoom';
import ListItem from '@mui/material/ListItem/ListItem';
import ListItemButton from '@mui/material/ListItemButton/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import InfoIcon from '@mui/icons-material/Info';
import Box from '@mui/material/Box/Box';
import SignIn from './managementsettings/ManagementAdminLoginSettings';
import List from '@mui/material/List';

const ManagementSettings = (): JSX.Element => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		
		dispatch(getUserData()).then((data) => {
		// eslint-disable-next-line no-console
			console.log('data', data);
		});
		
	});
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);

	useEffect(() => {
	}, [ loggedIn ]);
	
	const [ selectedComponent, setSelectedComponent ] = useState('');

	// Function to render the selected component in the placeholder
	const renderComponent = () => {

		if (loggedIn) {
			switch (selectedComponent) {
				case 'currentroom':
					return <>
						<CurrentRoomModal />
					</>;
				default:
					return <Box sx={{ minWidth: '400px' }}></Box>;
			}
		} else {
			return <SignIn />;
		}
	};

	return (
		<>
			<List>
				<ListItem key={'Room settings'} disablePadding onClick={() => setSelectedComponent('currentRoom')}>
					<ListItemButton disabled>
						<ListItemIcon>
							<InfoIcon />
						</ListItemIcon>
						<ListItemText primary={'Room settings'} />
					</ListItemButton>
					<CurrentRoomModal />
				</ListItem>
			
				<ListItem key={'Management settings'} disablePadding style={{ textDecoration: 'none' }} onClick={() => window.open('/mgmt-admin', 'edumeet-mgmt')}>
					<ListItemButton>
						<ListItemIcon>
							<InfoIcon />
						</ListItemIcon>
						<ListItemText primary={'Advanced management settings'} />
					</ListItemButton>
				</ListItem>
			</List>

			<div style={{ background: 'white', padding: '2px', maxWidth: '100%', minWidth: '300px' }}>
				{renderComponent()}
			</div></>
	);
};

export default ManagementSettings;
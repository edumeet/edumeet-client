import { useEffect } from 'react';
import { getUserData } from '../../store/actions/managementActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import CurrentRoomModal from '../managementservice/rooms/CurrentRoom';
import ListItem from '@mui/material/ListItem/ListItem';
import ListItemButton from '@mui/material/ListItemButton/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import InfoIcon from '@mui/icons-material/Info';
import SignIn from './managementsettings/ManagementAdminLoginSettings';
import List from '@mui/material/List';

const ManagementSettings = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);

	useEffect(() => {
		dispatch(getUserData());
	}, []);

	const renderComponent = () => {

		if (!loggedIn) {
			return <SignIn />;
		}

		return (
			<List>
				<ListItem key={'Room settings'} disablePadding >
					<ListItemButton>
						<ListItemText primary={'Room settings'} />
					</ListItemButton>
				</ListItem>
				<CurrentRoomModal />
				<ListItem key={'Management settings'} disablePadding style={{ textDecoration: 'none' }} onClick={() => window.open('/mgmt-admin', 'edumeet-mgmt')}>
					<ListItemButton>
						<ListItemIcon>
							<InfoIcon />
						</ListItemIcon>
						<ListItemText primary={'Advanced management settings'} />
					</ListItemButton>
				</ListItem>
			</List>
		);
	};

	return renderComponent();
};

export default ManagementSettings;
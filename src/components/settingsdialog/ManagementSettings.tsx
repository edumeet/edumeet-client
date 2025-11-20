import { useEffect } from 'react';
import { getUserData } from '../../store/actions/managementActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import CurrentRoomModal from '../managementservice/rooms/CurrentRoom';
import SignIn from './managementsettings/ManagementAdminLoginSettings';
import List from '@mui/material/List';
import InfoIcon from '@mui/icons-material/Info';

import { managementAdvancedSettingsLabel, managementRoomSettingsLabel } from '../translated/translatedComponents';
import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

const ManagementSettings = (): React.JSX.Element => {
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
						<ListItemText primary={managementRoomSettingsLabel()} />
					</ListItemButton>
				</ListItem>
				<CurrentRoomModal />
				<ListItem key={'Management settings'} disablePadding style={{ textDecoration: 'none' }} onClick={() => window.open('/mgmt-admin', 'edumeet-mgmt')}>
					<ListItemButton>
						<ListItemIcon>
							<InfoIcon />
						</ListItemIcon>
						<ListItemText primary={managementAdvancedSettingsLabel()} />
					</ListItemButton>
				</ListItem>
			</List>
		);
	};

	return renderComponent();
};

export default ManagementSettings;
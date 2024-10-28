import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import ManagementTenantSetting from './managementsettings/ManagementTenantSettings';
import { groupSettingsLabel, roleSettingsLabel, roomSettingsLabel, ruleSettingsLabel, tenantSettingsLabel, userSettingsLabel } from '../translated/translatedComponents';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import { useEffect } from 'react';
import { getUserData } from '../../store/actions/managementActions';
import { useAppDispatch } from '../../store/hooks';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ManagementRoomSetting from './managementsettings/ManagementRoomSettings';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ManagementUserSetting from './managementsettings/ManagementUserSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import ManagementGroupSetting from './managementsettings/ManagementGroupSettings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ManagementRoleSetting from './managementsettings/ManagementRoleSettings';
import RuleIcon from '@mui/icons-material/Rule';

const ManagementSettings = (): JSX.Element => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		
		dispatch(getUserData()).then((data) => {
		// eslint-disable-next-line no-console
			console.log('data', data);
		});
		
	});

	return (
		<List>
			<ListItem>
				<ListItemIcon sx={{ minWidth: 29 }}>
					<PeopleOutlineIcon />
				</ListItemIcon>
				<ListItemText primary={tenantSettingsLabel()} />
			</ListItem>
			<ManagementTenantSetting />
			<ListItem>
				<ListItemIcon sx={{ minWidth: 29 }}>
					<MeetingRoomIcon />
				</ListItemIcon>
				<ListItemText primary={roomSettingsLabel()} />
			</ListItem>
			<ManagementRoomSetting />
			<ListItem>
				<ListItemIcon sx={{ minWidth: 29 }}>
					<PersonSearchIcon />
				</ListItemIcon>
				<ListItemText primary={userSettingsLabel()} />
			</ListItem>
			<ManagementUserSetting />
			<ListItem>
				<ListItemIcon sx={{ minWidth: 29 }}>
					<SupervisorAccountIcon />
				</ListItemIcon>
				<ListItemText primary={groupSettingsLabel()} />
			</ListItem>
			<ManagementGroupSetting />
			<ListItem>
				<ListItemIcon sx={{ minWidth: 29 }}>
					<AdminPanelSettingsIcon />
				</ListItemIcon>
				<ListItemText primary={roleSettingsLabel()} />
			</ListItem>
			<ManagementRoleSetting />
			<ListItem>
				<ListItemIcon sx={{ minWidth: 29 }}>
					<RuleIcon />
				</ListItemIcon>
				<ListItemText primary={ruleSettingsLabel()} />
			</ListItem>
			
		</List>
	);
};

export default ManagementSettings;
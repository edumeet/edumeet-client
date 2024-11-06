import { useState } from 'react';
import { Collapse, List, ListItemButton, ListItemText } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { managementExtraSettingsLabel } from '../../translated/translatedComponents';
import GroupTable from '../../managementservice/groups/Groups';

const ManagementGroupSetting = (): JSX.Element => {
	const [ open, setOpen ] = useState(false);

	const handleClick = () => {
		setOpen(!open);
	};

	return (
		<List>
			<ListItemButton onClick={ handleClick }>
				<ListItemText primary={ managementExtraSettingsLabel() } />
				{open ? <ExpandLess /> : <ExpandMore />}
			</ListItemButton>
			<Collapse in={ open } timeout='auto' unmountOnExit>
				<List component='div'>
					<h4>Groups</h4>
					<GroupTable/>
				</List>
			</Collapse>
		</List>
	);

};

export default ManagementGroupSetting;
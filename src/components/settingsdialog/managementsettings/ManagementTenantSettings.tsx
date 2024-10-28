import { useState } from 'react';
import { Collapse, List, ListItemButton, ListItemText } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { managementExtraSettingsLabel } from '../../translated/translatedComponents';
import TenantTable from '../../managementservice/tenant/Tenant';
const ManagementTenantSetting = () => {
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
					{/* <TenantDesc /> */}
					<h4>Tenant(s)</h4>
					<TenantTable />
					<hr/>
					<h4>Tenant domain(s)</h4>
					{/* <TenantTable2 /> */}
					<hr/>
					<h4>Tenant auth(s)</h4>
					{/* <TenantTable3 /> */}
					<h4>TenantOwners</h4>
					{/* <TenantTable4 /> */}
					<hr/>
					<h4>TenantAdmins</h4>
					{/* <TenantTable5 /> */}
					<hr/>

				</List>
			</Collapse>
		</List>
	);

};

export default ManagementTenantSetting;
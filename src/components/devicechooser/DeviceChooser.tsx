import {
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	styled
} from '@mui/material';
import { memo } from 'react';
import { MediaDevice } from '../../services/deviceService';

interface DeviceChooserProps {
	value: string;
	// eslint-disable-next-line no-unused-vars
	setValue: (value: string) => void;
	devicesLabel: string;
	noDevicesLabel: string;
	disabled: boolean;
	devices: MediaDevice[];
}

export const ChooserDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'row',
	margin: theme.spacing(2, 0)
}));

export const StyledInputLabel = styled(InputLabel)(({ theme }) => ({
	padding: theme.spacing(0, 0.5),
	backgroundColor: 'white',
}));

const DeviceChooser = ({
	value,
	setValue,
	devicesLabel,
	noDevicesLabel,
	disabled,
	devices,
}: DeviceChooserProps): JSX.Element => {
	return (
		<FormControl variant="outlined" fullWidth>
			<StyledInputLabel>
				{ devices.length ? devicesLabel : noDevicesLabel }
			</StyledInputLabel>
			<Select
				value={devices.length ? (value || '') : ''}
				onChange={(event) => {
					if (event.target.value)
						setValue(event.target.value);
				}}
				displayEmpty
				autoWidth
				disabled={disabled}
			>
				{ devices.map((device, index) => {
					return (
						<MenuItem
							key={index}
							value={device.deviceId}
						>
							{ device.label ? device.label : (index + 1) }
						</MenuItem>
					);
				})}
			</Select>
		</FormControl>
	);
};

export default memo(DeviceChooser);
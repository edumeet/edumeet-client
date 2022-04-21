import {
	FormControl,
	FormHelperText,
	MenuItem,
	Select,
	styled
} from '@mui/material';
import { MediaDevice } from '../../services/deviceService';

interface DeviceChooserProps {
	value: string;
	// eslint-disable-next-line no-unused-vars
	setValue: (value: string) => void;
	name: string;
	devicesLabel: string;
	noDevicesLabel: string;
	disabled: boolean;
	devices: MediaDevice[];
}

export const ChooserDiv = styled('div')({
	display: 'flex',
	flexDirection: 'row'
});

const DeviceChooser = ({
	value,
	setValue,
	name,
	devicesLabel,
	noDevicesLabel,
	disabled,
	devices,
}: DeviceChooserProps): JSX.Element => {
	return (
		<FormControl fullWidth>
			<Select
				value={devices.length ? (value || '') : ''}
				onChange={(event) => {
					if (event.target.value)
						setValue(event.target.value);
				}}
				displayEmpty
				name={name}
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
			<FormHelperText>
				{ devices.length ? devicesLabel : noDevicesLabel }
			</FormHelperText>
		</FormControl>
	);
};

export default DeviceChooser;
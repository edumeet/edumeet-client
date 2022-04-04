import { FormControl, FormHelperText, MenuItem, Select } from '@mui/material';
import { MediaDevice } from '../../services/mediaService';

interface DeviceChooserOptions {
	value: string;
	// eslint-disable-next-line no-unused-vars
	setValue: (value: string) => void;
	name: string;
	devicesLabel: string;
	noDevicesLabel: string;
	disabled: boolean;
	devices: MediaDevice[];
}

const DeviceChooser = ({
	value,
	setValue,
	name,
	devicesLabel,
	noDevicesLabel,
	disabled,
	devices,
}: DeviceChooserOptions): JSX.Element => {
	return (
		<FormControl fullWidth>
			<Select
				value={value}
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
							{ device.label === '' ? (index + 1) : device.label }
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
import {
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	styled
} from '@mui/material';
import { memo, ReactElement } from 'react';
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
	extraButtons?: ReactElement;
}

export const ChooserDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	gap: theme.spacing(1),
	margin: theme.spacing(2, 0)
}));

const DeviceChooser = ({
	value,
	setValue,
	name,
	devicesLabel,
	noDevicesLabel,
	disabled,
	devices,
	extraButtons
}: DeviceChooserProps): JSX.Element => {
	const label = devices.length ? devicesLabel : noDevicesLabel;
	const labelId = new Date().getUTCMilliseconds();
	
	return (
		<FormControl variant='outlined' fullWidth>
			<InputLabel id={`device-simple-select-helper-label-${labelId}`}>
				{ label }
			</InputLabel>
			<Select
				labelId={`device-simple-select-helper-label-${labelId}`}
				label={label}
				startAdornment={extraButtons}
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
		</FormControl>
	);
};

export default memo(DeviceChooser);

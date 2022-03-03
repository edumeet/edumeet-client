import { ChangeEvent, FocusEvent } from 'react';
import { useIntl } from 'react-intl';
import { InputAdornment, TextField } from '@mui/material';
import randomString from 'random-string';
import { MeetingRoom } from '@mui/icons-material';

interface RoomNameFieldProps {
	roomId: string;
	// eslint-disable-next-line no-unused-vars
	setRoomId: (roomId: string) => void;
	disabled?: boolean;
}

const RoomNameField = ({
	roomId,
	setRoomId,
	disabled,
}: RoomNameFieldProps) => {
	const intl = useIntl();

	return (
		<TextField
			label={intl.formatMessage({
				id: 'label.roomName',
				defaultMessage: 'Room name'
			})}
			value={roomId}
			variant='outlined'
			margin='normal'
			disabled={disabled}
			onFocus={(event: FocusEvent<HTMLInputElement>) => event.target.select()}
			InputProps={{
				startAdornment: (
					<InputAdornment position='start' children={<MeetingRoom />} />
				)
			}}
			onChange={(event: ChangeEvent<HTMLInputElement>) => {
				setRoomId(event.target.value.toLowerCase().trim());
			}}
			onBlur={() => {
				if (!roomId.trim())
					setRoomId(randomString({ length: 8 }).toLowerCase());
			}}
		/>
	);
};

export default RoomNameField;
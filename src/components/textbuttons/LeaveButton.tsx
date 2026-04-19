import { Button } from '@mui/material';
import { useState } from 'react';
import GenericDialog from '../genericdialog/GenericDialog';
import {
	confirmLeaveLabel,
	leaveLabel,
	noLabel,
	yesLabel
} from '../translated/translatedComponents';
import { useAppDispatch, usePermissionSelector } from '../../store/hooks';
import { leaveRoom } from '../../store/actions/roomActions';
import { permissions } from '../../utils/roles';
import CloseMeetingButton from './CloseMeetingButton';

const LeaveButton = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const isModerator = usePermissionSelector(permissions.MODERATE_ROOM);
	const [ confirmOpen, setConfirmOpen ] = useState(false);

	const handleOpenConfirm = (): void => {
		setConfirmOpen(true);
	};

	const handleCloseConfirm = (): void => {
		setConfirmOpen(false);
	};

	const handleConfirmLeave = (): void => {
		setConfirmOpen(false);
		dispatch(leaveRoom());
	};

	return (
		<>
			<Button
				aria-label={leaveLabel()}
				color='error'
				variant='contained'
				onClick={handleOpenConfirm}
				size='small'
				tabIndex={-1}
			>
				{leaveLabel()}
			</Button>

			<GenericDialog
				open={confirmOpen}
				onClose={handleCloseConfirm}
				{...(isModerator && { maxWidth: 'sm' })}
				title={leaveLabel()}
				content={confirmLeaveLabel()}
				actions={
					<>
						<Button onClick={handleCloseConfirm} variant='outlined'>
							{noLabel()}
						</Button>
						<Button color='error' variant='contained' onClick={handleConfirmLeave}>
							{yesLabel()}
						</Button>
						{isModerator && <CloseMeetingButton />}
					</>
				}
			/>
		</>
	);
};

export default LeaveButton;
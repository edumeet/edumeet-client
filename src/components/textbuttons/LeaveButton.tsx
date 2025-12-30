import { Button } from '@mui/material';
import { useState } from 'react';
import GenericDialog from '../genericdialog/GenericDialog';
import {
	confirmLeaveLabel,
	leaveLabel,
	noLabel,
	yesLabel
} from '../translated/translatedComponents';
import { useAppDispatch } from '../../store/hooks';
import { leaveRoom } from '../../store/actions/roomActions';

const LeaveButton = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
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
			>
				{leaveLabel()}
			</Button>

			<GenericDialog
				open={confirmOpen}
				onClose={handleCloseConfirm}
				title={leaveLabel()}
				content={confirmLeaveLabel()}
				actions={
					<>
						<Button onClick={handleCloseConfirm}>
							{noLabel()}
						</Button>
						<Button color='error' variant='contained' onClick={handleConfirmLeave}>
							{yesLabel()}
						</Button>
					</>
				}
			/>
		</>
	);
};

export default LeaveButton;
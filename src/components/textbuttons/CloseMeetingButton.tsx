import { Button } from '@mui/material';
import { useState } from 'react';
import GenericDialog from '../genericdialog/GenericDialog';
import { closeMeeting } from '../../store/actions/roomActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	closeMeetingLabel,
	noLabel,
	yesLabel
} from '../translated/translatedComponents';

const CloseMeetingButton = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const closeMeetingInProgress =
		useAppSelector((state) => state.room.closeMeetingInProgress);

	const [ confirmOpen, setConfirmOpen ] = useState(false);

	const handleOpenConfirm = (): void => {
		setConfirmOpen(true);
	};

	const handleCloseConfirm = (): void => {
		setConfirmOpen(false);
	};

	const handleConfirmCloseMeeting = (): void => {
		setConfirmOpen(false);
		dispatch(closeMeeting());
	};

	return (
		<>
			<Button
				aria-label={closeMeetingLabel()}
				color='error'
				variant='contained'
				onClick={handleOpenConfirm}
				disabled={closeMeetingInProgress}
				size='small'
			>
				{closeMeetingLabel()}
			</Button>

			<GenericDialog
				open={confirmOpen}
				onClose={handleCloseConfirm}
				title={closeMeetingLabel()}
				// No new labels requested — reuse room.closeMeeting text as the confirmation content too.
				content={`${closeMeetingLabel()}?`}
				actions={
					<>
						<Button onClick={handleCloseConfirm} disabled={closeMeetingInProgress}>
							{noLabel()}
						</Button>
						<Button
							color='error'
							variant='contained'
							onClick={handleConfirmCloseMeeting}
							disabled={closeMeetingInProgress}
						>
							{yesLabel()}
						</Button>
					</>
				}
			/>
		</>
	);
};

export default CloseMeetingButton;
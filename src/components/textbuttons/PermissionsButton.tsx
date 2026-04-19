import { Button, ButtonProps } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { managePermissionsLabel } from '../translated/translatedComponents';

const PermissionsButton = ({ size }: Pick<ButtonProps, 'size'> = {}): React.JSX.Element => {
	const dispatch = useAppDispatch();

	const handleOpen = (): void => {
		dispatch(uiActions.setUi({ permissionsDialogOpen: true }));
	};

	return (
		<Button
			aria-label={managePermissionsLabel()}
			variant='contained'
			onClick={handleOpen}
			size={size}
		>
			{managePermissionsLabel()}
		</Button>
	);
};

export default PermissionsButton;

import { Button } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { clearFiles } from '../../store/actions/filesharingActions';
import {
	clearFilesLabel,
} from '../translated/translatedComponents';

const ClearFilesharingButton = (): JSX.Element => {
	const dispatch = useAppDispatch();

	const handleClearFiles = (): void => {
		dispatch(clearFiles());
	};

	return (
		<Button
			aria-label={clearFilesLabel()}
			color='error'
			variant='contained'
			onClick={handleClearFiles}
		>
			{ clearFilesLabel() }
		</Button>
	);
};

export default ClearFilesharingButton;
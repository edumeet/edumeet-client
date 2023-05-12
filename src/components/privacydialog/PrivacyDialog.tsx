import {
	Button,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	styled
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import StyledDialog from '../dialog/StyledDialog';
import { Check, Close, PrivacyTip } from '@mui/icons-material';
import {
	privacyAllowLabel,
	privacyNotAllowLabel,
	privacyRecordingLabel,
	privacyTitleLabel
} from '../translated/translatedComponents';
import { setRecordable } from '../../store/actions/meActions';
import { meActions } from '../../store/slices/meSlice';

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
	display: 'flex',
	'.MuiSvgIcon-root': {
		margin: theme.spacing('auto', 1, 'auto', 0)
	}
}));

const PrivacyDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const privacyDialogOpen = useAppSelector((state) => state.ui.privacyDialogOpen);
	const { privacyDialogDisplayed } = useAppSelector((state) => state.me);

	const handleClose = () => {
		dispatch(uiActions.setUi({
			privacyDialogOpen: false
		}));

		if (!privacyDialogDisplayed) {
			dispatch(meActions.setPrivacyDialogDisplayed(true));
		}
	};

	const handleClick = (value: boolean) => {
		dispatch(setRecordable(value));

		handleClose();
	};

	return (
		<StyledDialog
			open={ privacyDialogOpen && !privacyDialogDisplayed }
			onClose={ handleClose }
		>
			<StyledDialogTitle>
				<PrivacyTip />
				{ privacyTitleLabel() }
			</StyledDialogTitle>
			<DialogContent>
				<DialogContentText>
					{ privacyRecordingLabel() }
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button
					aria-label={ privacyNotAllowLabel() }
					onClick={ () => handleClick(false) }
					startIcon={ <Close /> }
				>
					{ privacyNotAllowLabel() }
				</Button>
				<Button
					aria-label={ privacyAllowLabel() }
					onClick={ () => handleClick(true) }
					startIcon={ <Check /> }
				>
					{ privacyAllowLabel() }
				</Button>
			</DialogActions>
		</StyledDialog>
	);
};

export default PrivacyDialog;
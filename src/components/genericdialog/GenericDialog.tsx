import { ReactNode } from 'react';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Dialog } from '@mui/material';
import { memo } from 'react';

export const RawStyledDialog = memo(styled(Dialog)({
	'.MuiDialog-paper': {
		width: '100vw',
	}
}));

interface GenericDialogProps {
	title?: ReactNode;
	content?: ReactNode;
	actions?: ReactNode;
	open?: boolean;
	onClose?: () => void;
	maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const StyledPrecallDialog = styled(RawStyledDialog)(({ theme }) => ({
	'& .MuiDialog-paper': {
		padding: theme.spacing(0),
	},
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
	paddingTop: theme.spacing(1),
	paddingBottom: theme.spacing(1),
	paddingLeft: theme.spacing(2),
	paddingRight: theme.spacing(2),
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
	paddingTop: theme.spacing(1),
	paddingBottom: theme.spacing(1),
	paddingLeft: theme.spacing(2),
	paddingRight: theme.spacing(2),
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
	paddingTop: theme.spacing(1),
	paddingBottom: theme.spacing(2),
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
}));

const GenericDialog = ({
	title,
	content,
	actions,
	open = true,
	onClose,
	maxWidth = 'xs',
}: GenericDialogProps): JSX.Element => {
	return (
		<StyledPrecallDialog open={open} onClose={onClose} maxWidth={maxWidth}>
			<StyledDialogTitle>
				{ title }
			</StyledDialogTitle>
			<StyledDialogContent style={{ paddingTop: 5 }}>
				{ content }
			</StyledDialogContent>
			<StyledDialogActions>
				{ actions }
			</StyledDialogActions>
		</StyledPrecallDialog>
	);
};

export default GenericDialog;
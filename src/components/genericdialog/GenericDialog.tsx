import { ReactNode } from 'react';
import { DialogActions, DialogContent, DialogTitle, Link } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Dialog } from '@mui/material';
import { memo } from 'react';
import Grid from '@mui/material/Grid2';

import edumeetConfig from '../../utils/edumeetConfig';

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
	showFooter?: boolean;
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

const StyledDialogFooter = styled(DialogActions)(({ theme }) => ({
	paddingTop: theme.spacing(1),
	paddingBottom: theme.spacing(2),
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
	justifyContent: 'center',
}));

const GenericDialog = ({
	title,
	content,
	actions,
	open = true,
	onClose,
	maxWidth = 'xs',
	showFooter = false,
}: GenericDialogProps): React.JSX.Element => {
	const infoTooltipEnabled = edumeetConfig.infoTooltipEnabled;
	const infoTooltipText = edumeetConfig.infoTooltipText;
	const infoTooltipLink = edumeetConfig.infoTooltipLink;
	const infoTooltipDesc = edumeetConfig.infoTooltipDesc;
	
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
			
			{infoTooltipEnabled && showFooter && <StyledDialogFooter>
				<Grid container>
					<Grid size={12} textAlign={'center'}>
						{infoTooltipLink!='' ? <Link href={infoTooltipLink}>{ infoTooltipText }</Link> : infoTooltipText }
					</Grid>
					{infoTooltipDesc!='' && <Grid size={12} textAlign={'justify'}>
						{ infoTooltipDesc }
					</Grid>
					}
				</Grid>
			</StyledDialogFooter>}
		</StyledPrecallDialog>
	);
};

export default GenericDialog;
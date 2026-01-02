import { ReactNode } from 'react';
import { DialogActions, DialogContent, DialogTitle, Link } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Dialog } from '@mui/material';
import { memo } from 'react';
import Grid from '@mui/material/Grid';
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
	precallTitleBackground?: boolean;
}

const StyledPrecallDialog = styled(RawStyledDialog)(({ theme }) => ({
	'& .MuiDialog-paper': {
		padding: theme.spacing(0),
	},
}));

const StyledDialogTitle = styled(DialogTitle, {
	shouldForwardProp: (prop) => prop !== 'precallTitleBackground',
})<{ precallTitleBackground?: boolean }>(({ theme, precallTitleBackground }) => ({
	paddingTop: theme.spacing(1),
	paddingBottom: theme.spacing(1),
	paddingLeft: theme.spacing(2),
	paddingRight: theme.spacing(2),
	...(precallTitleBackground ? {
		backgroundColor: theme.precallTitleColor,
		color: theme.precallTitleTextColor,
		'& .MuiIconButton-root, & .MuiSvgIcon-root': {
			color: theme.precallTitleIconColor,
		},
	} : {}),
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
	precallTitleBackground = false,
}: GenericDialogProps): React.JSX.Element => {
	const infoTooltipEnabled = edumeetConfig.infoTooltipEnabled;
	const infoTooltipText = edumeetConfig.infoTooltipText;
	const infoTooltipLink = edumeetConfig.infoTooltipLink;
	const infoTooltipDesc = edumeetConfig.infoTooltipDesc;
	
	return (
		<StyledPrecallDialog open={open} onClose={onClose} maxWidth={maxWidth}>
			<StyledDialogTitle precallTitleBackground={precallTitleBackground}>
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
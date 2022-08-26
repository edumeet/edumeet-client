import { ReactNode } from 'react';
import {
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	styled,
	Typography,
	useTheme
} from '@mui/material';
import StyledDialog from '../../components/dialog/StyledDialog';
import edumeetConfig from '../../utils/edumeetConfig';
import { useAppSelector } from '../../store/hooks';
import { loginLabel, logoutLabel } from '../../components/translated/translatedComponents';
import LoginButton from '../controlbuttons/LoginButton';

interface PrecallDialogProps {
	content?: ReactNode;
	actions?: ReactNode;
}

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
	'&.MuiDialogContent-root': {
		padding: theme.spacing(1, 3, 2.5, 3)
	}
}));

const PrecallDialog = ({
	content,
	actions
}: PrecallDialogProps): JSX.Element => {
	const theme = useTheme();
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);

	return (
		<StyledDialog open>
			<DialogTitle>
				<Grid
					container
					direction='row'
					justifyContent='space-between'
					alignItems='center'
				>
					<Grid item>
						<Typography variant='h5'>Edumeet</Typography>
						{ theme.logo ?
							<img alt='Logo' src={theme.logo} /> :
							<Typography variant='h5'> {edumeetConfig.title} </Typography>
						}
					</Grid>

					<Grid item>
						<Grid
							container
							direction='row'
							justifyContent='flex-end'
							alignItems='center'
						>
							{ edumeetConfig.loginEnabled &&
								<Grid item>
									<Grid container direction='column' alignItems='center'>
										<Grid item>
											<LoginButton
												type='iconbutton'
												toolTipLocation='left'
											/>
										</Grid>
										<Grid item>
											{ loggedIn ? logoutLabel() : loginLabel() }
										</Grid>
									</Grid>
								</Grid>
							}
						</Grid>
					</Grid>
				</Grid>
			</DialogTitle>
			<StyledDialogContent>
				{ content }
			</StyledDialogContent>
			<DialogActions>
				<Grid
					container
					direction='row'
					justifyContent='flex-end'
					alignItems='flex-end'
					spacing={1}
				>
					<Grid item>
						{ actions }
					</Grid>
				</Grid>
			</DialogActions>
		</StyledDialog>
	);
};

export default PrecallDialog;
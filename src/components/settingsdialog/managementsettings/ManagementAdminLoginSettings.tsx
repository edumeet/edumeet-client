import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { adminLogin } from '../../../store/actions/permissionsActions';
import { useAppDispatch } from '../../../store/hooks';
import { CustomLoginButton } from '../../controlbuttons/LoginButton';
import { useState } from 'react';
import { emailAddressLabel, localAdminLoginLabel, loginToUseManagementLabel, passwordLabel, signInLabel } from '../../translated/translatedComponents';

export default function SignIn() {

	const dispatch = useAppDispatch();

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const data = new FormData(event.currentTarget);

		const email = data.get('email') as string;
		const password = data.get('password') as string;

		if (email && password) {
			// Authenticate with the local email/password strategy
			dispatch(adminLogin(email, password));
		}
		
	};

	const [ show, setShow ] = useState(false);

	return (
		<Container component="main">
			<Box
				sx={{
					marginTop: 4,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<h2>{loginToUseManagementLabel()}</h2>
				<Box>
					<CustomLoginButton />
				</Box>
				<Button color='secondary' onClick={() => setShow((prev) => !prev)}>{localAdminLoginLabel()}</Button>
				{show && <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
					<TextField
						margin="normal"
						required
						fullWidth
						id="email"
						label={emailAddressLabel()}
						name="email"
						autoComplete="email"
						autoFocus
					/>
					<TextField
						margin="normal"
						required
						fullWidth
						name="password"
						label={passwordLabel()}
						type="password"
						id="password"
						autoComplete="current-password"
					/>
					<Button
						type="submit"
						fullWidth
						variant="contained"
						sx={{ mt: 3, mb: 2 }}
					>
						{signInLabel()}
					</Button>
				</Box>
				}
			
			</Box>
		</Container>
	);
}
import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import { adminLogin } from '../../../store/actions/permissionsActions';
import { useAppDispatch } from '../../../store/hooks';
import LoginButton from '../../controlbuttons/LoginButton';

export default function SignIn() {

	const dispatch = useAppDispatch();

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const data = new FormData(event.currentTarget);

		const email = data.get('email') as string;
		const password = data.get('password') as string;

		if (email && password) {
			// Authenticate with the local email/password strategy
			dispatch(adminLogin(email, password)).then(() => {
				// todo display success/fail
			});
		}
		
	};

	return (
		<>
			<Container component="main">
				<CssBaseline />
				<Box
					sx={{
						marginTop: 8,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
					}}
				>
					<img src='/images/logo.edumeet.svg' />
					<hr/>
					<Box>
						<LoginButton />
					</Box>
					<hr/>
					<Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
						<TextField
							margin="normal"
							required
							fullWidth
							id="email"
							label="Email Address"
							name="email"
							autoComplete="email"
							autoFocus
						/>
						<TextField
							margin="normal"
							required
							fullWidth
							name="password"
							label="Password"
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
						Sign In
						</Button>
					</Box>
				</Box>
			</Container>
		</>
	);
}
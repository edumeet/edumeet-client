import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Box, Link, Typography } from '@mui/material';
import randomString from 'random-string';
import TextInputField from '../../components/textinputfield/TextInputField';
import { joinLabel, roomNameLabel, imprintLabel, privacyLabel } from '../../components/translated/translatedComponents';
import GenericDialog from '../../components/genericdialog/GenericDialog';
import StyledBackground from '../../components/StyledBackground';
import PrecallTitle from '../../components/precalltitle/PrecallTitle';
import { QRCode } from 'react-qrcode-logo';
import edumeetConfig from '../../utils/edumeetConfig';

const LandingPage = (): JSX.Element => {
	const navigate = useNavigate();
	const randomizeOnBlank = edumeetConfig.randomizeOnBlank;
	const [ roomId, setRoomId ] = useState(randomizeOnBlank ? randomString({ length: 8 }).toLowerCase() : '');
	const onClicked = () => navigate(`/${roomId}`);

	const privacyUrl = edumeetConfig.privacyUrl ?? '';
	const imprintUrl = edumeetConfig.imprintUrl ?? '';

	return (
		<StyledBackground>
			<GenericDialog
				title={ <PrecallTitle /> }
				content={
					<Container style={{ textAlign: 'center' }}>
						<QRCode value={`${window.location.protocol}//${window.location.hostname }/${roomId}`} />
						<TextInputField
							label={roomNameLabel()}
							value={roomId}
							setValue={setRoomId}
							onEnter={onClicked}
							randomizeOnBlank={randomizeOnBlank}
							autoFocus
						/>
					</Container>

				}
				actions={
					<Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
						<Box display="flex" alignItems="left">
							{imprintUrl.trim() !== '' && (
								<Link href={imprintUrl} target="_blank" color="inherit" underline="none">
									<Typography variant="body2">{ imprintLabel() }</Typography>
								</Link>
							)}
							{privacyUrl.trim() !== '' && (
								<Link href={privacyUrl} target="_blank" color="inherit" underline="none" style={{ marginLeft: '16px' }}>
									<Typography variant="body2">{ privacyLabel() }</Typography>
								</Link>
							)}
						</Box>
						<Button
							onClick={onClicked}
							variant='contained'
							disabled={!roomId}
							size='small'
						>
							{ joinLabel()}
						</Button>
					</Box>
				}
			/>
			
		</StyledBackground>
	);
};

export default LandingPage;

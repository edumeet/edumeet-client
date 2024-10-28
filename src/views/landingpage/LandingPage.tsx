import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container } from '@mui/material';
import randomString from 'random-string';
import TextInputField from '../../components/textinputfield/TextInputField';
import { joinLabel, roomNameLabel } from '../../components/translated/translatedComponents';
import GenericDialog from '../../components/genericdialog/GenericDialog';
import StyledBackground from '../../components/StyledBackground';
import PrecallTitle from '../../components/precalltitle/PrecallTitle';
import { QRCode } from 'react-qrcode-logo';
import ImpressumButton from '../../components/controlbuttons/ImpressumButton';
import edumeetConfig from '../../utils/edumeetConfig';

const LandingPage = (): JSX.Element => {
	const navigate = useNavigate();
	const randomizeOnBlank = edumeetConfig.randomizeOnBlank;
	const [ roomId, setRoomId ] = useState(randomizeOnBlank ? randomString({ length: 8 }).toLowerCase() : '');
	const onClicked = () => navigate(`/${roomId}`);

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
					<><ImpressumButton />
						<Button
							onClick={onClicked}
							variant='contained'
							disabled={!roomId}
							size='small'
						>
							{ joinLabel()}
						</Button></>
				}
			/>
			
		</StyledBackground>
	);
};

export default LandingPage;

import { useEffect, useState } from 'react';
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
import { startListeners, stopListeners } from '../../store/actions/startActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

const LandingPage = (): React.JSX.Element | null => {
	const navigate = useNavigate();
	const randomizeOnBlank = edumeetConfig.randomizeOnBlank;
	const [ roomId, setRoomId ] = useState(randomizeOnBlank ? randomString({ length: 8 }).toLowerCase() : '');
	const onClicked = () => navigate(`/${roomId}`);

	const privacyUrl = edumeetConfig.privacyUrl ?? '';
	const imprintUrl = edumeetConfig.imprintUrl ?? '';
	const qrCodeEnabled = edumeetConfig.qrCodeEnabled;

	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(startListeners());

		return () => {
			dispatch(stopListeners());
		};
	}, [ dispatch ]);

	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);

	if (localeInProgress) {
		return null;
	}

	return (
		<StyledBackground>
			<GenericDialog
				showFooter={true}
				precallTitleBackground={true}
				title={ <PrecallTitle /> }
				content={
					<Container style={{ textAlign: 'center' }}>
						{qrCodeEnabled && <QRCode value={`${window.location.protocol}//${window.location.hostname }/${roomId}`} />}
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

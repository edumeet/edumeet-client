import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { useIntl } from 'react-intl';
import randomString from 'random-string';
import TextInputField from '../../components/textinputfield/TextInputField';
import { JoinMessage, roomNameLabel } from '../../components/translated/translatedComponents';
import PrecallDialog from '../../components/precalldialog/PrecallDialog';
import StyledBackground from '../../components/StyledBackground';

const LandingPage = (): JSX.Element => {
	const intl = useIntl();
	const navigate = useNavigate();
	const [ roomId, setRoomId ] = useState(randomString({ length: 8 }).toLowerCase());

	const onClicked = () => {
		navigate(`/${roomId}`);
	};

	return (
		<StyledBackground>
			<PrecallDialog
				content={
					<TextInputField
						label={roomNameLabel(intl)}
						value={roomId}
						setValue={setRoomId}
						onEnter={onClicked}
						randomizeOnBlank
						autoFocus
					/>
				}
				actions={
					<Button
						onClick={onClicked}
						variant='contained'
						color='primary'
						disabled={!roomId}
					>
						<JoinMessage />
					</Button>
				}
			/>
		</StyledBackground>
	);
};

export default LandingPage;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import randomString from 'random-string';
import TextInputField from '../../components/textinputfield/TextInputField';
import { joinLabel, roomNameLabel } from '../../components/translated/translatedComponents';
import PrecallDialog from '../../components/precalldialog/PrecallDialog';
import StyledBackground from '../../components/StyledBackground';

const LandingPage = (): JSX.Element => {
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
						label={roomNameLabel()}
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
						{ joinLabel()}
					</Button>
				}
			/>
		</StyledBackground>
	);
};

export default LandingPage;
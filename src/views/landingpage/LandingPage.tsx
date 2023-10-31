import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import randomString from 'random-string';
import TextInputField from '../../components/textinputfield/TextInputField';
import { joinLabel, roomNameLabel } from '../../components/translated/translatedComponents';
import GenericDialog from '../../components/genericdialog/GenericDialog';
import StyledBackground from '../../components/StyledBackground';
import PrecallTitle from '../../components/precalltitle/PrecallTitle';

const LandingPage = (): JSX.Element => {
	const navigate = useNavigate();
	const [ roomId, setRoomId ] = useState(randomString({ length: 8 }).toLowerCase());
	const onClicked = () => navigate(`/${roomId}`);

	return (
		<StyledBackground>
			<GenericDialog
				title={ <PrecallTitle /> }
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
						disabled={!roomId}
						size='small'
					>
						{ joinLabel()}
					</Button>
				}
			/>
		</StyledBackground>
	);
};

export default LandingPage;
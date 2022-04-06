import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { useIntl } from 'react-intl';
import randomString from 'random-string';
import TextInputField from '../../components/textinputfield/TextInputField';
import { JoinMessage, roomNameLabel } from '../../components/translated/translatedComponents';
import { useAppDispatch } from '../../store/hooks';
import { roomActions } from '../../store/slices/roomSlice';
import PrecallDialog from '../../components/precalldialog/PrecallDialog';
import StyledBackground from '../../components/StyledBackground';

const LandingPage = (): JSX.Element => {
	const intl = useIntl();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const [ roomId, setRoomId ] = useState(randomString({ length: 8 }).toLowerCase());

	const onClicked = () => {
		dispatch(roomActions.updateRoom({ name: roomId }));
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
						randomizeOnBlank
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
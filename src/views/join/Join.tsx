import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import TextInputField from '../../components/textinputfield/TextInputField';
import { useAppDispatch, useAppSelector, useNotifier } from '../../store/hooks';
import { joinLabel, yourNameLabel } from '../../components/translated/translatedComponents';
import { AccountCircle } from '@mui/icons-material';
import MediaPreview from '../../components/mediapreview/MediaPreview';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';
import GenericDialog from '../../components/genericdialog/GenericDialog';
import { roomActions } from '../../store/slices/roomSlice';
import { settingsActions } from '../../store/slices/settingsSlice';
import { connect } from '../../store/actions/roomActions';
import PrecallTitle from '../../components/precalltitle/PrecallTitle';
import BlurBackgroundSwitch from '../../components/blurbackgroundswitch/BlurBackgroundSwitch';

interface JoinProps {
	roomId: string;
}

const Join = ({ roomId }: JoinProps): JSX.Element => {
	useNotifier();
	const dispatch = useAppDispatch();

	const { displayName } = useAppSelector((state) => state.settings);
	const joinInProgress = useAppSelector((state) => state.room.joinInProgress);
	const mediaLoading = useAppSelector((state) => state.media.videoInProgress || state.media.audioInProgress);

	const [ name, setName ] = useState(displayName || '');

	const handleDisplayNameChange = (value: string) => {
		setName(value.trim() ? value : value.trim());
	};

	const handleJoin = () => {
		dispatch(settingsActions.setDisplayName(name));
		dispatch(connect(roomId));
	};

	useEffect(() => {
		const dn = new URL(window.location.href).searchParams.get('displayName');

		if (dn) {
			dispatch(settingsActions.setDisplayName(dn));
			setName(dn);
		}
	}, []);

	useEffect(() => {
		const headless = new URL(window.location.href).searchParams.get('headless');

		if (headless) {
			const myNewURL = window.location.href.split('?')[0];
			
			window.history.pushState({}, '', myNewURL);
			handleJoin();
		}
	}, []);

	useEffect(() => {
		dispatch(roomActions.updateRoom({ id: roomId }));
	}, []);

	return (
		<GenericDialog
			title={ <PrecallTitle /> }
			content={
				<>
					<MediaPreview />
					<AudioInputChooser />
					<VideoInputChooser />
					<BlurBackgroundSwitch />
					<TextInputField
						label={yourNameLabel()}
						value={name}
						setValue={handleDisplayNameChange}
						onEnter={handleJoin}
						startAdornment={<AccountCircle />}
						autoFocus
					/>
				</>
			}
			actions={
				<Button
					onClick={handleJoin}
					variant='contained'
					disabled={!name || joinInProgress || mediaLoading }
					size='small'
				>
					{ joinLabel() }
				</Button>
			}
		/>
	);
};

export default Join;

import { styled } from '@mui/material/styles';
import { useAppSelector } from '../../store/hooks';
import { meProducersSelector } from '../../store/selectors';
import MicButton from '../controlbuttons/MicButton';
import ScreenshareButton from '../controlbuttons/ScreenshareButton';
import WebcamButton from '../controlbuttons/WebcamButton';
import MediaControls from '../mediacontrols/MediaControls';
import { MeTagMessage } from '../translated/translatedComponents';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';

interface MeProps {
	advancedMode?: boolean;
	spacing: number;
	style: Record<'width' | 'height', number>
}

const MeTag = styled('p')({
	position: 'absolute',
	float: 'left',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	color: 'rgba(255, 255, 255, 0.5)',
	zIndex: 30,
	margin: 0,
	opacity: 0,
	fontSize: '4em',
	transition: 'opacity 0.1s ease-in-out',
	'&:hover': {
		opacity: 1
	}
});

const Me = ({
	spacing,
	style
}: MeProps): JSX.Element => {
	const {
		webcamProducer,
		screenProducer,
		extraVideoProducers
	} = useAppSelector(meProducersSelector);

	const activeSpeaker =
		useAppSelector((state) => state.me.id === state.room.activeSpeakerId);

	return (
		<>
			<VideoBox
				activeSpeaker={activeSpeaker}
				order={1}
				margin={spacing}
				sx={{ ...style }}
			>
				<MeTag>
					<MeTagMessage />
				</MeTag>
				<MediaControls
					orientation='vertical'
					horizontalPlacement='right'
					verticalPlacement='center'
				>
					<MicButton onColor='default' offColor='error' disabledColor='default' />
					<WebcamButton onColor='default' offColor='error' disabledColor='default' />
					{ !screenProducer && <ScreenshareButton onColor='default' offColor='error' disabledColor='default' /> }
				</MediaControls>
				<VideoView
					mirrored={true} // TODO
					trackId={webcamProducer?.trackId}
				/>
			</VideoBox>
			{ screenProducer && (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={2}
					margin={spacing}
					sx={{ ...style }}
				>
					<MeTag>
						<MeTagMessage />
					</MeTag>
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<ScreenshareButton onColor='default' offColor='error' disabledColor='default' />
					</MediaControls>
					<VideoView trackId={screenProducer?.trackId} />
				</VideoBox>
			)}
			{ extraVideoProducers.map((producer) => (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={3}
					margin={spacing}
					key={producer.trackId}
					sx={{ ...style }}
				>
					<MeTag>
						<MeTagMessage />
					</MeTag>
					<VideoView
						trackId={producer.trackId}
					/>
				</VideoBox>
			)) }
		</>
	);
};

export default Me;
import { useAppSelector } from '../../store/hooks';
import { meProducersSelector } from '../../store/selectors';
import MicButton from '../controlbuttons/MicButton';
import ScreenshareButton from '../controlbuttons/ScreenshareButton';
import WebcamButton from '../controlbuttons/WebcamButton';
import DisplayName from '../displayname/DisplayName';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';

interface MeProps {
	advancedMode?: boolean;
	spacing: number;
	style: Record<'width' | 'height', number>
}

const Me = ({
	spacing,
	style
}: MeProps): JSX.Element => {
	const {
		webcamProducer,
		screenProducer,
		extraVideoProducers
	} = useAppSelector(meProducersSelector);

	const displayName = useAppSelector((state) => state.settings.displayName);
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
				<DisplayName disabled={false} displayName={displayName} />
				<MediaControls
					orientation='vertical'
					horizontalPlacement='right'
					verticalPlacement='center'
				>
					<MicButton
						onColor='default'
						offColor='error'
						disabledColor='default'
					/>
					<WebcamButton
						onColor='default'
						offColor='error'
						disabledColor='default'
					/>
					{ !screenProducer &&
						<ScreenshareButton
							onColor='default'
							offColor='default'
							disabledColor='default'
						/>
					}
				</MediaControls>
				{ webcamProducer && <VideoView
					mirrored
					producer={webcamProducer}
				/> }
			</VideoBox>
			{ screenProducer && (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={2}
					margin={spacing}
					sx={{ ...style }}
				>
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<ScreenshareButton
							onColor='default'
							offColor='error'
							disabledColor='default'
						/>
					</MediaControls>
					<VideoView producer={screenProducer} contain />
				</VideoBox>
			)}
			{ extraVideoProducers.map((producer) => (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={3}
					margin={spacing}
					key={producer.id}
					sx={{ ...style }}
				>
					<VideoView producer={producer} />
				</VideoBox>
			)) }
		</>
	);
};

export default Me;
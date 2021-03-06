import { useAppSelector } from '../../store/hooks';
import { meProducersSelector } from '../../store/selectors';
import MicButton from '../controlbuttons/MicButton';
import ScreenshareButton from '../controlbuttons/ScreenshareButton';
import ShareButton from '../controlbuttons/ShareButton';
import StopProducerButton from '../controlbuttons/StopProducerButton';
import WebcamButton from '../controlbuttons/WebcamButton';
import DisplayName from '../displayname/DisplayName';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import Volume from '../volume/Volume';

interface MeProps {
	spacing: number;
	style: Record<'width' | 'height', number>
}

const Me = ({
	spacing,
	style
}: MeProps): JSX.Element => {
	const {
		micProducer,
		webcamProducer,
		screenProducer,
		extraVideoProducers
	} = useAppSelector(meProducersSelector);

	const mirroredSelfView = useAppSelector((state) => state.settings.mirroredSelfView);
	const displayName = useAppSelector((state) => state.settings.displayName);
	const activeSpeaker =
		useAppSelector((state) => state.me.id === state.room.activeSpeakerId);

	return (
		<>
			<VideoBox
				activeSpeaker={activeSpeaker}
				order={1}
				margin={spacing}
				width={style.width}
				height={style.height}
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
					<ShareButton />
				</MediaControls>
				{ micProducer && <Volume producer={micProducer} /> }
				{ webcamProducer && <VideoView
					mirrored={mirroredSelfView}
					producer={webcamProducer}
				/> }
			</VideoBox>
			{ screenProducer && (
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={2}
					margin={spacing}
					width={style.width}
					height={style.height}
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
					width={style.width}
					height={style.height}
				>
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<StopProducerButton
							onColor='default'
							offColor='error'
							disabledColor='default'
							producerId={producer.id}
						/>
					</MediaControls>
					<VideoView producer={producer} />
				</VideoBox>
			)) }
		</>
	);
};

export default Me;
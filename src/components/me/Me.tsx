import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { isMobileSelector, meProducersSelector } from '../../store/selectors';
import ScreenshareButton from '../controlbuttons/ScreenshareButton';
import StopProducerButton from '../controlbuttons/StopProducerButton';
import DisplayName from '../displayname/DisplayName';
import MediaControls from '../mediacontrols/MediaControls';
import PeerStatsView from '../peerstatsview/PeerStatsView';
import UnmuteAlert from '../unmutealert/UnmuteAlert';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import Volume from '../volume/Volume';

interface MeProps {
	style: Record<'width' | 'height', number>
}

const Me = ({
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
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const isMobile = useAppSelector(isMobileSelector);
	const showStats = useAppSelector((state) => state.ui.showStats);
	
	return (
		<>
			{ !hideSelfView && (
				<VideoBox
					// activeSpeaker={activeSpeaker}
					order={1}
					width={style.width}
					height={style.height}
					zIndex={0}
				>
					<DisplayName disabled={false} displayName={displayName} isMe />
					{ micProducer && !isMobile && <UnmuteAlert micProducer={micProducer} /> }
					{ micProducer && <Volume producer={micProducer} /> }
					{ webcamProducer && <VideoView
						mirrored={mirroredSelfView}
						producer={webcamProducer}
					/> }
					{showStats && <PeerStatsView producerId={webcamProducer?.id}/>}
				</VideoBox>
			)}
			{ screenProducer && (
				<VideoBox
					// activeSpeaker={activeSpeaker}
					order={2}
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
					{showStats && <PeerStatsView producerId={screenProducer.id}/>}
				</VideoBox>
			)}
			{ extraVideoProducers.map((producer) => (
				<VideoBox
					// activeSpeaker={activeSpeaker}
					order={3}
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
					{showStats && <PeerStatsView producerId={producer?.id}/>}
					<VideoView producer={producer} />
				</VideoBox>
			)) }
		</>
	);
};

export default Me;
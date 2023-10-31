import React from 'react';
import { useAppSelector, useIsActiveSpeaker } from '../../store/hooks';
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
}: MeProps): React.JSX.Element => {
	const {
		micProducer,
		webcamProducer,
		screenProducer,
		extraVideoProducers
	} = useAppSelector(meProducersSelector);

	const mirroredSelfView = useAppSelector((state) => state.settings.mirroredSelfView);
	const displayName = useAppSelector((state) => state.settings.displayName);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const id = useAppSelector((state) => state.me.id);
	const isActiveSpeaker = useIsActiveSpeaker(id);
	const isMobile = useAppSelector(isMobileSelector);
	const showStats = useAppSelector((state) => state.ui.showStats);

	return (
		<>
			{ !hideSelfView && (
				<VideoBox
					activeSpeaker={isActiveSpeaker}
					order={1}
					width={style.width}
					height={style.height}
				>
					{ webcamProducer && <VideoView mirrored={mirroredSelfView} producer={webcamProducer} /> }
					{ micProducer && <Volume producer={micProducer} /> }
					{ showStats && <PeerStatsView producerId={webcamProducer?.id}/> }
					{ micProducer && !isMobile && <UnmuteAlert micProducer={micProducer} /> }
					<DisplayName disabled={false} displayName={displayName} isMe />
				</VideoBox>
			)}
			{ screenProducer && (
				<VideoBox
					activeSpeaker={isActiveSpeaker}
					order={2}
					width={style.width}
					height={style.height}
				>
					<VideoView producer={screenProducer} contain />
					<DisplayName disabled={false} displayName={displayName} isMe />
					{ showStats && <PeerStatsView producerId={screenProducer.id}/> }
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
				</VideoBox>
			)}
			{ extraVideoProducers.map((producer) => (
				<VideoBox
					activeSpeaker={isActiveSpeaker}
					order={3}
					key={producer.id}
					width={style.width}
					height={style.height}
				>
					<VideoView producer={producer} />
					<DisplayName disabled={false} displayName={displayName} isMe />
					{ showStats && <PeerStatsView producerId={producer?.id}/> }
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
				</VideoBox>
			)) }
		</>
	);
};

export default Me;
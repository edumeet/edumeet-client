import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { meProducersSelector } from '../../store/selectors';
import MicButton from '../controlbuttons/MicButton';
import ScreenshareButton from '../controlbuttons/ScreenshareButton';
import StopProducerButton from '../controlbuttons/StopProducerButton';
import WebcamButton from '../controlbuttons/WebcamButton';
import DisplayName from '../displayname/DisplayName';
import MediaControls from '../mediacontrols/MediaControls';
import PeerStatsView from '../peerstatsview/PeerStatsView';
import UnmuteAlert from '../unmutealert/UnmuteAlert';
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
	const controlButtonsBar =
		useAppSelector((state) => state.settings.controlButtonsBar);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const audioOnly = useAppSelector((state) => state.settings.audioOnly);
	// const activeSpeaker = useAppSelector((state) => state.me.id === state.room.activeSpeakerId);
	const browser = useAppSelector((state) => state.me.browser);
	const showStats = useAppSelector((state) => state.ui.showStats);
	
	return (
		<>
			<VideoBox
				// activeSpeaker={activeSpeaker}
				order={1}
				margin={spacing}
				width={style.width}
				height={style.height}
				zIndex={0}
			>
				<DisplayName disabled={false} displayName={displayName} />
				{ !(hideSelfView || controlButtonsBar || browser.platform === 'mobile') && (
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
						{ !audioOnly && (
							<>
								<WebcamButton
									onColor='default'
									offColor='error'
									disabledColor='default'
								/>
								<ScreenshareButton />
							</>
						) }
					</MediaControls>
				)}
				{ micProducer && browser.platform !== 'mobile' && <UnmuteAlert micProducer={micProducer} /> }
				{ micProducer && <Volume producer={micProducer} /> }
				{ webcamProducer && <VideoView
					mirrored={mirroredSelfView}
					producer={webcamProducer}
				/> }
				{showStats && <PeerStatsView producerId={webcamProducer?.id}/>}
			</VideoBox>
			{ screenProducer && (
				<VideoBox
					// activeSpeaker={activeSpeaker}
					order={2}
					margin={spacing}
					width={style.width}
					height={style.height}
				>
					{ !(hideSelfView || controlButtonsBar) && (
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
					)}
					<VideoView producer={screenProducer} contain />
					{showStats && <PeerStatsView producerId={screenProducer.id}/>}
				</VideoBox>
			)}
			{ extraVideoProducers.map((producer) => (
				<VideoBox
					// activeSpeaker={activeSpeaker}
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
					{showStats && <PeerStatsView producerId={producer?.id}/>}
					<VideoView producer={producer} />
				</VideoBox>
			)) }
		</>
	);
};

export default Me;
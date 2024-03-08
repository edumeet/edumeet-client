import React from 'react';
import { useAppSelector, useIsActiveSpeaker } from '../../store/hooks';
import { isMobileSelector } from '../../store/selectors';
import ScreenshareButton from '../controlbuttons/ScreenshareButton';
import DisplayName from '../displayname/DisplayName';
import MediaControls from '../mediacontrols/MediaControls';
import UnmuteAlert from '../unmutealert/UnmuteAlert';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import Volume from '../volume/Volume';
import ExtraVideoButton from '../controlbuttons/ExtraVideoButton';

interface MeProps {
	style: Record<'width' | 'height', number>
}

const Me = ({ style }: MeProps): React.JSX.Element => {
	const mirroredSelfView = useAppSelector((state) => state.settings.mirroredSelfView);
	const displayName = useAppSelector((state) => state.settings.displayName);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const id = useAppSelector((state) => state.me.id);
	const isActiveSpeaker = useIsActiveSpeaker(id);
	const isMobile = useAppSelector(isMobileSelector);
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const webcamEnabled = useAppSelector((state) => state.me.webcamEnabled);
	const screenEnabled = useAppSelector((state) => state.me.screenEnabled);
	const extraVideoEnabled = useAppSelector((state) => state.me.extraVideoEnabled);

	return (
		<>
			{ !hideSelfView && (
				<VideoBox
					activeSpeaker={isActiveSpeaker}
					order={1}
					width={style.width}
					height={style.height}
				>
					{ webcamEnabled && <VideoView mirrored={mirroredSelfView} source='webcam' /> }
					{ micEnabled && <Volume /> }
					{ micEnabled && !isMobile && <UnmuteAlert /> }
					<DisplayName disabled={false} displayName={displayName} isMe />
				</VideoBox>
			)}
			{ screenEnabled && (
				<VideoBox
					activeSpeaker={isActiveSpeaker}
					order={2}
					width={style.width}
					height={style.height}
				>
					<VideoView source='screen' contain />
					<DisplayName disabled={false} displayName={displayName} isMe />
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
			{ extraVideoEnabled &&
				<VideoBox
					activeSpeaker={isActiveSpeaker}
					order={3}
					width={style.width}
					height={style.height}
				>
					<VideoView source='extravideo' />
					<DisplayName disabled={false} displayName={displayName} isMe />
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<ExtraVideoButton
							onColor='default'
							offColor='error'
							disabledColor='default'
						/>
					</MediaControls>
				</VideoBox>
			}
		</>
	);
};

export default Me;

import React from 'react';
import { useAppSelector, useIsActiveSpeaker } from '../../store/hooks';
import { isMobileSelector } from '../../store/selectors';
import DisplayName from '../displayname/DisplayName';
import UnmuteAlert from '../unmutealert/UnmuteAlert';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import Volume from '../volume/Volume';

interface MeProps {
	style: Record<'width' | 'height', number>
}

const Me = ({ style }: MeProps): React.JSX.Element => {
	const mirroredSelfView = useAppSelector((state) => state.settings.mirroredSelfView);
	const displayName = useAppSelector((state) => state.settings.displayName);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const contain = useAppSelector((state) => state.settings.videoContainEnabled);
	const id = useAppSelector((state) => state.me.id);
	const isActiveSpeaker = useIsActiveSpeaker(id);
	const isMobile = useAppSelector(isMobileSelector);
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const webcamEnabled = useAppSelector((state) => state.me.webcamEnabled);

	return (
		<>
			{ !hideSelfView && (
				<VideoBox
					activeSpeaker={isActiveSpeaker}
					order={1}
					width={style.width}
					height={style.height}
				>
					{ webcamEnabled && <VideoView mirrored={mirroredSelfView} contain={contain} source='webcam' /> }
					{ micEnabled && <Volume /> }
					{ micEnabled && !isMobile && <UnmuteAlert /> }
					<DisplayName disabled={false} displayName={displayName} isMe />
				</VideoBox>
			)}
		</>
	);
};

export default Me;

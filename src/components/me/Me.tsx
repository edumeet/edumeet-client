import React from 'react';
import { useEffect } from 'react';
import { useAppSelector, useIsActiveSpeaker, useAppDispatch } from '../../store/hooks';
import { isMobileSelector } from '../../store/selectors';
import { styled } from '@mui/material/styles';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ClapIcon from '@mui/icons-material/SignLanguage';
import PartyIcon from '@mui/icons-material/Celebration';
import LaughIcon from '@mui/icons-material/SentimentVerySatisfied';
import { Box } from '@mui/material';
import DisplayName from '../displayname/DisplayName';
import UnmuteAlert from '../unmutealert/UnmuteAlert';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import Volume from '../volume/Volume';
import PeerStatsView from '../rtpquality/PeerStatsView';
import QualityIndicator from '../rtpquality/QualityIndicator';

interface MeProps {
	style: Record<'width' | 'height', number>
}

const ReactionIconContainer = styled(Box)(({ theme }) => ({
	position: 'absolute',
	top: theme.spacing(1),
	left: '50%',
	transform: 'translateX(-50%)',
	zIndex: 10,
	padding: theme.spacing(0.5),
	backgroundColor: 'rgba(0, 0, 0, 0.4)',
	borderRadius: theme.shape.borderRadius,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: '2rem',
}));

const reactionIcons: { [key: string]: React.JSX.Element } = {
	thumbup: <ThumbUpIcon fontSize="inherit" style={{ color: 'white' }} />,
	clap: <ClapIcon fontSize="inherit" style={{ color: 'white' }} />,
	party: <PartyIcon fontSize="inherit" style={{ color: 'white' }} />,
	laugh: <LaughIcon fontSize="inherit" style={{ color: 'white' }} />,
};

const Me = ({ style }: MeProps): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const mirroredSelfView = useAppSelector((state) => state.settings.mirroredSelfView);
	const displayName = useAppSelector((state) => state.settings.displayName);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const contain = useAppSelector((state) => state.settings.videoContainEnabled);
	const id = useAppSelector((state) => state.me.id);
	const isActiveSpeaker = useIsActiveSpeaker(id);
	const isMobile = useAppSelector(isMobileSelector);
	const showStats = useAppSelector((state) => state.ui.showStats);
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const webcamEnabled = useAppSelector((state) => state.me.webcamEnabled);
	const reaction = useAppSelector((state) => state.me.sendReaction);

	useEffect(() => {}, [ reaction, dispatch ]);

	const currentReactionIcon = reaction ? reactionIcons[reaction] : null;

	return (
		<>
			{ !hideSelfView && (
				<VideoBox
					activeSpeaker={isActiveSpeaker}
					order={1}
					width={style.width}
					height={style.height}
				>
					{currentReactionIcon && (
						<ReactionIconContainer>
							{currentReactionIcon}
						</ReactionIconContainer>
					)}
					{ webcamEnabled && <VideoView mirrored={mirroredSelfView} contain={contain} source='webcam' /> }
					{ micEnabled && <Volume me={true} /> }
					{ micEnabled && !isMobile && <UnmuteAlert /> }

					<DisplayName disabled={false} displayName={displayName} isMe />
					{ !isMobile && showStats && <PeerStatsView /> }
					<QualityIndicator />

				</VideoBox>
			)}
		</>
	);
};

export default Me;

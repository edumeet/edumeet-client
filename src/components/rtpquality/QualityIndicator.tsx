import React from 'react';
import { ProducerSource } from '../../utils/types';
import QualityBadge, { QualityBadgeSize } from './QualityBadge';
import { Quality, useClientQuality, useInboundTrackStats, useOutboundTrackStats } from './useTrackStats';

interface QualityIndicatorProps {
	// Consumed video track of a remote peer.
	consumerId?: string;
	// Consumed audio track of the same peer.
	audioConsumerId?: string;
	// Locally produced source.
	source?: ProducerSource;
	fontSize?: QualityBadgeSize;
	placement?: 'top' | 'bottom' | 'left' | 'right';
}

/** The track in the worst shape is the one worth warning about. */
const worstOf = (candidates: (Quality | undefined)[]): Quality | undefined => {
	const known = candidates.filter((candidate): candidate is Quality => Boolean(candidate));

	if (known.length === 0) return undefined;

	return known.reduce((worst, candidate) => {
		if (candidate.score === undefined) return worst;
		if (worst.score === undefined) return candidate;

		return candidate.score < worst.score ? candidate : worst;
	});
};

/**
 * Quality warning for one participant.
 *
 * With no props it reports the client as a whole (which is where congestion
 * shows up, since that is detected per peer connection rather than per track) -
 * that is the form used in the top bar for the local user. Given consumer ids
 * it reports that peer's consumed tracks, which is the form used in the
 * participant list.
 *
 * It is never rendered over a video tile: overlays end up baked into local
 * recordings, which capture the page.
 */
const QualityIndicator = ({
	consumerId,
	audioConsumerId,
	source,
	fontSize = 'small',
	placement = 'bottom',
}: QualityIndicatorProps): React.JSX.Element => {
	const perPeer = Boolean(consumerId || audioConsumerId || source);

	const videoQuality = useInboundTrackStats(consumerId);
	const audioQuality = useInboundTrackStats(audioConsumerId);
	const outboundQuality = useOutboundTrackStats(source);
	const clientQuality = useClientQuality(!perPeer);

	const quality = perPeer
		? worstOf([ videoQuality, audioQuality, outboundQuality ])
		: clientQuality;

	return (
		<QualityBadge
			score={quality?.score}
			reasons={quality?.reasons}
			issues={quality?.issues}
			fontSize={fontSize}
			placement={placement}
		/>
	);
};

export default QualityIndicator;

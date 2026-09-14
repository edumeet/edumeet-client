import { useContext, useEffect, useState } from 'react';
import { ServiceContext } from '../../store/store';
import { OwnProblem, OwnSideQuality, PeerProblem, PeerTrackIds, ownProblem, ownSideQuality, peerProblem } from './problemTriage';

/** Live view of {@link ownProblem}, refreshed on every stats round and issue change. */
export const useOwnProblem = (): OwnProblem | undefined => {
	const { mediaService } = useContext(ServiceContext);
	const [ problem, setProblem ] = useState<OwnProblem | undefined>();

	useEffect(() => {
		const monitor = mediaService.monitor;

		setProblem(undefined);

		if (!monitor) return;

		const refresh = () => setProblem(ownProblem(monitor));

		refresh();
		monitor.on('stats-collected', refresh);
		monitor.on('issue', refresh);
		monitor.on('issue-resolved', refresh);

		return () => {
			monitor.off('stats-collected', refresh);
			monitor.off('issue', refresh);
			monitor.off('issue-resolved', refresh);
		};
	}, [ mediaService, mediaService.monitor ]);

	return problem;
};

/** Live view of {@link peerProblem} for the given consumers of one peer. */
export const usePeerProblem = (consumers: { audio?: string; video?: string }): PeerProblem | undefined => {
	const { mediaService } = useContext(ServiceContext);
	const [ problem, setProblem ] = useState<PeerProblem | undefined>();

	useEffect(() => {
		const monitor = mediaService.monitor;

		setProblem(undefined);

		if (!monitor || (!consumers.audio && !consumers.video)) return;

		const refresh = () => {
			const tracks: PeerTrackIds = {
				audio: consumers.audio ? mediaService.getConsumer(consumers.audio)?.track.id : undefined,
				video: consumers.video ? mediaService.getConsumer(consumers.video)?.track.id : undefined,
			};

			setProblem(peerProblem(monitor, tracks));
		};

		refresh();
		monitor.on('stats-collected', refresh);
		monitor.on('issue', refresh);
		monitor.on('issue-resolved', refresh);

		return () => {
			monitor.off('stats-collected', refresh);
			monitor.off('issue', refresh);
			monitor.off('issue-resolved', refresh);
		};
	}, [ mediaService, mediaService.monitor, consumers.audio, consumers.video ]);

	return problem;
};

/** Live view of {@link ownSideQuality} for the client panel of the quality window. */
export const useOwnSideQuality = (): OwnSideQuality | undefined => {
	const { mediaService } = useContext(ServiceContext);
	const [ quality, setQuality ] = useState<OwnSideQuality | undefined>();

	useEffect(() => {
		const monitor = mediaService.monitor;

		setQuality(undefined);

		if (!monitor) return;

		const refresh = () => setQuality(ownSideQuality(monitor));

		refresh();
		monitor.on('stats-collected', refresh);
		monitor.on('issue', refresh);
		monitor.on('issue-resolved', refresh);

		return () => {
			monitor.off('stats-collected', refresh);
			monitor.off('issue', refresh);
			monitor.off('issue-resolved', refresh);
		};
	}, [ mediaService, mediaService.monitor ]);

	return quality;
};

import { useContext, useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { peersArraySelector } from '../../store/selectors';
import { ServiceContext } from '../../store/store';
import { ConnectivityReport, buildConnectivityReport } from './connectivityReport';

/**
 * Keeps a live connectivity report from the client monitor.
 *
 * Shared by the top bar indicator (which needs it all the time to know whether
 * to show itself) and the dialog (which only needs it while open), hence the
 * `enabled` switch instead of two separate subscriptions.
 */
export const useConnectivityReport = (enabled = true): ConnectivityReport | undefined => {
	const { mediaService } = useContext(ServiceContext);
	const peerCount = useAppSelector(peersArraySelector).length;
	const roomState = useAppSelector((state) => state.room.state);
	const [ report, setReport ] = useState<ConnectivityReport | undefined>();

	useEffect(() => {
		const monitor = mediaService.monitor;

		setReport(undefined);

		if (!monitor || !enabled || roomState !== 'joined') return;

		const refresh = () => setReport(buildConnectivityReport(monitor, { expectInbound: peerCount > 0 }));

		refresh();

		monitor.on('stats-collected', refresh);
		monitor.on('issue', refresh);
		monitor.on('issue-resolved', refresh);

		return () => {
			monitor.off('stats-collected', refresh);
			monitor.off('issue', refresh);
			monitor.off('issue-resolved', refresh);
		};
	}, [ mediaService, mediaService.monitor, enabled, roomState, peerCount ]);

	return report;
};

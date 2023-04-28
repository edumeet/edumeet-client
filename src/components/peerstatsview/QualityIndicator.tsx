import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { ServiceContext } from '../../store/store';
import { AnomalyDetector } from '../../utils/anomalyDetector';

interface QualityIndicatorProps {
	peerConnectionLabel?: string;
}

const QualityIndicator = ({
	peerConnectionLabel,
}: QualityIndicatorProps): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ isDistorted, setIsDistorted ] = useState<boolean>(false);

	useEffect(() => {
		// this runs on mount
		const monitor = mediaService.getMonitor();
		
		if (!monitor) {
			return;
		}

		const storage = monitor.storage;
		const windowSize = 30;
		const stdMultiplierThreshold = 3;
		const minDeviationThreshold = 0.05;
		const detector = new AnomalyDetector(windowSize, stdMultiplierThreshold, minDeviationThreshold);

		const listener: () => void = () => {
			const peerConnectionEntry = Array.from(storage.peerConnections()).find((pc) => pc.label === peerConnectionLabel);

			if (!peerConnectionEntry) {
				return;
			}
			const measurement = peerConnectionEntry.updates.avgRttInS;
			const detectedAnomaly = detector.isAnomaly(measurement);

			setIsDistorted(detectedAnomaly);
		};

		return () => {
			if (!monitor) {
				return;
			}
			if (listener) {
				monitor.off('stats-collected', listener);
			}
		};
	}, []);

	return (<p>{isDistorted ? 'Distorted' : ''}</p>);
};

export default QualityIndicator;

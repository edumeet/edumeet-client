import LinearProgress from '@mui/material/LinearProgress';
import { useContext, useEffect, useState } from 'react';
import { ServiceContext } from '../../store/store';
import { VolumeWatcher } from '../../utils/volumeWatcher';
import hark from 'hark';

const MicVolume = (): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ volumeLevel, setVolume ] = useState<number>(0);

	useEffect(() => {
		let volumeWatcher: VolumeWatcher | undefined;

		// Add hark for mic
		if (mediaService.previewMicTrack) {
			const harkStream = new MediaStream();

			harkStream.addTrack(mediaService.previewMicTrack.clone());

			const micHark = hark(harkStream, {
				play: false,
				interval: 100,
				threshold: -60,
				history: 100
			});

			volumeWatcher = new VolumeWatcher({ hark: micHark });
		}

		const onVolumeChange = ({ scaledVolume }: { scaledVolume: number }): void => {
			setVolume(scaledVolume*10); // Range: 0-100
		};

		volumeWatcher?.on('volumeChange', onVolumeChange);

		return () => {
			volumeWatcher?.off('volumeChange', onVolumeChange);
		};
	}, [ mediaService.previewMicTrack ]);

	return (
		<LinearProgress color='success' variant="determinate" value={volumeLevel} />
	);
};

export default MicVolume;

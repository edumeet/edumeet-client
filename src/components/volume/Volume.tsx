import { styled } from '@mui/material';
import type { Consumer } from 'mediasoup-client/lib/Consumer';
import { useContext, useEffect, useState } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { ServiceContext } from '../../store/store';
import { VolumeWatcher } from '../../utils/volumeWatcher';
import type { Consumer as PeerConsumer } from 'ortc-p2p/src/types';
import hark from 'hark';
import { useAppSelector } from '../../store/hooks';

type VolumeBarProps = {
	small: number;
	volume?: number;
}

const VolumeContainer = styled('div')<VolumeBarProps>(({ theme, small }) => ({
	position: small ? 'relative' : 'absolute',
	display: 'flex',
	width: theme.spacing(1),
	top: 0,
	bottom: 0,
	right: 2,
	alignItems: 'center',
}));

const VolumeBar = styled('div')<VolumeBarProps & { muted: boolean }>(({ small, volume = 0, muted = false }) => ({
	width: small ? 3 : 6,
	borderRadius: 6,
	transitionDuration: '0.10s',
	transitionProperty: small ? 'height' : 'height, background-color',
	...(small ? {
		backgroundColor: 'rgba(0, 0, 0, 1)',
		height: volume * 3,
	} : {
		backgroundColor: muted
			? `rgba(${255 - (20 * volume)}, ${255 - (20 * volume)}, ${255 - (20 * volume)}, 0.65)`
			: `rgba(${100 + (20 * volume)}, ${255 - (20 * volume)}, 0, 0.65)`,
		height: `${volume * 10}%`,
	})
}));

interface VolumeProps {
	small?: boolean;
	consumer?: StateConsumer;
}

const Volume = ({
	small = false,
	consumer,
}: VolumeProps): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ volume, setVolume ] = useState<number>(0);
	const audioMuted = useAppSelector((state) => state.me.audioMuted);

	useEffect(() => {
		let media: Consumer | PeerConsumer | undefined;
		let volumeWatcher: VolumeWatcher | undefined;

		if (consumer)
			media = mediaService.getConsumer(consumer.id);
		else if (mediaService.mediaSenders['mic'].volumeWatcher)
			volumeWatcher = mediaService.mediaSenders['mic'].volumeWatcher;
		else if (mediaService.previewMicTrack) {
			// We do not send it so the state is different on join dialog.
			const harkStream = new MediaStream();
			
			harkStream.addTrack(mediaService.previewMicTrack.clone());
			
			const micHark = hark(harkStream, {
				play: false,
				interval: 50,
				threshold: -60,
				history: 100
			});
			
			volumeWatcher = new VolumeWatcher({ hark: micHark });
		}

		if (media)
			volumeWatcher = media.appData.volumeWatcher as VolumeWatcher | undefined;

		const onVolumeChange = ({ scaledVolume }: { scaledVolume: number }): void => {
			setVolume(scaledVolume);
		};

		volumeWatcher?.on('volumeChange', onVolumeChange);

		return () => {
			volumeWatcher?.off('volumeChange', onVolumeChange);
		};
	}, [ consumer, mediaService.previewMicTrack ]);

	// Props workaround for: https://github.com/mui/material-ui/issues/25925
	return (
		<VolumeContainer small={small ? 1 : 0}>
			<VolumeBar volume={volume} small={small ? 1 : 0} muted={audioMuted} />
		</VolumeContainer>
	);
};

export default Volume;

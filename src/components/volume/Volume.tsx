import { styled } from '@mui/material';
import type { Consumer } from 'mediasoup-client/lib/Consumer';
import type { Producer } from 'mediasoup-client/lib/Producer';
import { useContext, useEffect, useState } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { ServiceContext } from '../../store/store';
import { VolumeWatcher } from '../../utils/volumeWatcher';
import type { Producer as PeerProducer } from 'ortc-p2p/src/types';
import type { Consumer as PeerConsumer } from 'ortc-p2p/src/types';

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

const VolumeBar = styled('div')<VolumeBarProps>(({ small, volume = 0 }) => ({
	width: small ? 3 : 6,
	borderRadius: 6,
	transitionDuration: '0.10s',
	transitionProperty: small ? 'height' : 'height, background-color',
	...(small ? {
		backgroundColor: 'rgba(0, 0, 0, 1)',
		height: volume * 3,
	} : {
		backgroundColor: `rgba(${100 + (20 * volume)}, ${255 - (20 * volume)}, 0, 0.65)`,
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

	useEffect(() => {
		let media: Consumer | PeerConsumer | Producer | PeerProducer | undefined;
		let volumeWatcher: VolumeWatcher | undefined;

		if (consumer)
			media = mediaService.getConsumer(consumer.id);
		else
			media = mediaService.micProducer;

		if (media)
			volumeWatcher = media.appData.volumeWatcher as VolumeWatcher | undefined;

		const onVolumeChange = ({ scaledVolume }: { scaledVolume: number }): void => {
			setVolume(scaledVolume);
		};

		volumeWatcher?.on('volumeChange', onVolumeChange);

		return () => {
			volumeWatcher?.off('volumeChange', onVolumeChange);
		};
	}, [ consumer ]);

	// Props workaround for: https://github.com/mui/material-ui/issues/25925
	return (
		<VolumeContainer small={small ? 1 : 0}>
			<VolumeBar volume={volume} small={small ? 1 : 0} />
		</VolumeContainer>
	);
};

export default Volume;

import { styled } from '@mui/material';
import { Consumer } from 'mediasoup-client/lib/Consumer';
import { Producer } from 'mediasoup-client/lib/Producer';
import { useContext, useEffect, useState } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { StateProducer } from '../../store/slices/producersSlice';
import { ServiceContext } from '../../store/store';
import { VolumeWatcher } from '../../utils/volumeWatcher';

type VolumeBarProps = {
	small: number;
	volume?: number;
}

const VolumeContainer = styled('div')<VolumeBarProps>(({ small }) => ({
	position: small ? 'relative' : 'absolute',
	display: 'flex',
	flexDirection: small ? 'row' : 'column',
	...(small && {
		float: 'right',
		backgroundSize: '75%'
	}),
	justifyContent: small ? 'flex-start' : 'center',
	width: small ? '1vmin' : 10,
	...(!small && {
		top: 0,
		bottom: 0,
		right: 2,
		alignItems: 'center'
	}),
	zIndex: 21
}));

const VolumeBar = styled('div')<VolumeBarProps>(({ small, volume = 0 }) => ({
	width: small ? 3 : 6,
	borderRadius: small ? 2 : 6,
	transitionDuration: '0.25s',
	transitionProperty: small ? 'opacity, background-color' : 'height background-color',
	...(small ? {
		backgroundSize: '75%',
		backgroundRepeat: 'no-repeat',
		backgroundColor: 'rgba(0, 0, 0, 1)',
		position: 'absolute',
		top: '50%',
		transform: 'translateY(-50%)',
		height: `${volume / 5}vh`,
	} : {
		background: 'rgba(yellow, 0.65)',
		backgroundColor: `rgba(255, ${255 - (23 * volume)}, 0, 0.65)`,
		height: `${volume * 10}%`,
	})
}));

interface VolumeProps {
	small?: boolean;
	consumer?: StateConsumer;
	producer?: StateProducer;
}

const Volume = ({
	small = false,
	consumer,
	producer
}: VolumeProps): JSX.Element => {
	const { mediaService } = useContext(ServiceContext);
	const [ volume, setVolume ] = useState<number>(0);

	useEffect(() => {
		let media: Consumer | Producer | undefined;
		let volumeWatcher: VolumeWatcher | undefined;

		if (consumer) {
			media = mediaService.getConsumer(consumer.id);
		}

		if (producer) {
			media = mediaService.getProducer(producer.id);
		}

		if (media)
			volumeWatcher = media.appData.volumeWatcher as VolumeWatcher;

		const onVolumeChange = ({ scaledVolume }: { scaledVolume: number }): void => {
			setVolume(scaledVolume);
		};

		volumeWatcher?.on('volumeChange', onVolumeChange);

		return () => {
			volumeWatcher?.off('volumeChange', onVolumeChange);
		};
	}, []);

	// Props workaround for: https://github.com/mui/material-ui/issues/25925
	return (
		<VolumeContainer small={small ? 1 : 0}>
			<VolumeBar volume={!producer?.paused ? volume : 0} small={small ? 1 : 0} />
		</VolumeContainer>
	);
};

export default Volume;
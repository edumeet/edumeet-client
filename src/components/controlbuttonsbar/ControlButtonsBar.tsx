import { useAppSelector } from '../../store/hooks';
import MediaControls from '../../components/mediacontrols/MediaControls';
import MicButton from '../../components/controlbuttons/MicButton';
import WebcamButton from '../../components/controlbuttons/WebcamButton';
import ScreenshareButton from '../../components/controlbuttons/ScreenshareButton';

const ControlButtonsBar = (): JSX.Element => {
	const controlButtonsBar =
		useAppSelector((state) => state.settings.controlButtonsBar);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);

	return (
		<>
			{ (hideSelfView || controlButtonsBar) &&
				<MediaControls
					orientation='vertical'
					horizontalPlacement='left'
					verticalPlacement='center'
				>
					<MicButton
						onColor='default'
						offColor='error'
						disabledColor='default'
					/>
					<WebcamButton
						onColor='default'
						offColor='error'
						disabledColor='default'
					/>
					<ScreenshareButton />
				</MediaControls>
			}
		</>
	);
};

export default ControlButtonsBar;
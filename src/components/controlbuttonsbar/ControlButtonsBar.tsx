import { useAppSelector } from '../../store/hooks';
import MediaControls from '../../components/mediacontrols/MediaControls';
import MicButton from '../../components/controlbuttons/MicButton';
import WebcamButton from '../../components/controlbuttons/WebcamButton';
import ScreenshareButton from '../../components/controlbuttons/ScreenshareButton';

const ControlButtonsBar = (): JSX.Element => {
	const controlButtonsBar =
		useAppSelector((state) => state.settings.controlButtonsBar);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const browser = useAppSelector((state) => state.me.browser);
	const isMobile = browser.platform === 'mobile';

	return (
		<>
			{ (hideSelfView || controlButtonsBar || isMobile) &&
				<MediaControls
					orientation={ isMobile ? 'horizontal' : 'vertical' }
					horizontalPlacement={ isMobile ? 'center' : 'left' }
					verticalPlacement={ isMobile ? 'bottom' :'center' }
					autoHide={ !isMobile }
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
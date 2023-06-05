import { useAppSelector } from '../../store/hooks';
import MediaControls from '../../components/mediacontrols/MediaControls';
import MicButton from '../../components/controlbuttons/MicButton';
import WebcamButton from '../../components/controlbuttons/WebcamButton';
import ScreenshareButton from '../../components/controlbuttons/ScreenshareButton';
import { isMobileSelector } from '../../store/selectors';

const ControlButtonsBar = (): JSX.Element => {
	const controlButtonsBar =
		useAppSelector((state) => state.settings.controlButtonsBar);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const isMobile = useAppSelector(isMobileSelector);

	return (
		<>
			{ (hideSelfView || controlButtonsBar || isMobile) &&
				<MediaControls
					orientation='horizontal'
					horizontalPlacement='center'
					verticalPlacement='bottom'
					autoHide={ !isMobile }
				>
					<MicButton
						onColor='default'
						offColor='error'
						disabledColor='default'
						toolTipLocation='bottom'
					/>
					<WebcamButton
						onColor='default'
						offColor='error'
						disabledColor='default'
						toolTipLocation='bottom'
					/>
					{ !isMobile && <ScreenshareButton toolTipLocation='bottom' /> }
				</MediaControls>
			}
		</>
	);
};

export default ControlButtonsBar;
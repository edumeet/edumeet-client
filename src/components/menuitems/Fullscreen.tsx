import { MenuItem } from '@mui/material';
import fscreen from 'fscreen';
import {
	enterFullscreenLabel,
} from '../translated/translatedComponents';
import MoreActions from '../moreactions/MoreActions';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';

const Fullscreen = ({
	onClick
}: MenuItemProps): React.JSX.Element => {

	const handleToggleFullscreen = () => {
		if (fscreen.fullscreenElement) {
			fscreen.exitFullscreen();
		} else {
			fscreen.requestFullscreen(document.documentElement);
		}
	};

	return (
		<MenuItem
			aria-label={enterFullscreenLabel()}
			onClick={() => {
				onClick();
				handleToggleFullscreen();
			}}
		>
			<FullscreenIcon />
			<MoreActions>
				{ enterFullscreenLabel() }
			</MoreActions>
		</MenuItem>
	);
};

export default Fullscreen;
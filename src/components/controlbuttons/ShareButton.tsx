import { useIntl } from 'react-intl';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { useState } from 'react';
import FloatingMenu from '../floatingmenu/FloatingMenu';
import { shareLabel } from '../translated/translatedComponents';
import AddIcon from '@mui/icons-material/Add';
import Screenshare from '../menuitems/Screenshare';
import ExtraVideo from '../menuitems/ExtraVideo';

const ShareButton = (props: ControlButtonProps): JSX.Element => {
	const intl = useIntl();
	const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>();
	const handleMenuClose = () => {
		setAnchorEl(null);
	};
	const isMenuOpen = Boolean(anchorEl);

	return (
		<>
			<ControlButton
				toolTip={shareLabel(intl)}
				aria-haspopup
				onClick={(event) => {
					setAnchorEl(event.currentTarget);
				}}
				{ ...props }
			>
				<AddIcon />
			</ControlButton>
			<FloatingMenu
				anchorEl={anchorEl}
				open={isMenuOpen}
				onClose={handleMenuClose}
			>
				<Screenshare onClick={handleMenuClose} />
				<ExtraVideo onClick={handleMenuClose} />
			</FloatingMenu>
		</>
	);
};

export default ShareButton;
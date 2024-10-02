import { MenuItem } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import {
	startDrawingLabel,
	stopDrawingLabel,
	// removeDrawingsLabel
} from '../translated/translatedComponents';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { drawingActions } from '../../store/slices/drawingSlice'; // eslint-disable-line
import { permissions } from '../../utils/roles'; // eslint-disable-line
import DrawingIcon from '@mui/icons-material/Edit';
// import RemoveDrawingIcon from '@mui/icons-material/Backspace';

const Drawing = ({
	onClick
}: MenuItemProps): JSX.Element => {
	const dispatch = useAppDispatch(); // eslint-disable-line
	// const hasExtraVideoPermission = usePermissionSelector(permissions.SHARE_EXTRA_VIDEO);
	// const locked = useAppSelector((state) => state.permissions.locked);
	// const locked = useAppSelector((state) => state.permissions.locked);
	const drawingEnabled = useAppSelector((state) => state.drawing.drawingEnabled);
	const drawingLabel = drawingEnabled ? stopDrawingLabel() : startDrawingLabel();

	return (

		<MenuItem
			aria-label={drawingLabel}
			// disabled={!hasExtraVideoPermission}
			onClick={() => {
				onClick();

				// drawingOpen ? dispatch(unlock()) : dispatch(lock());
				dispatch(drawingActions.setDrawingEnabled(!drawingEnabled));
			}}
		>
			{ <DrawingIcon /> }
			<MoreActions>
				{ drawingLabel }
			</MoreActions>
		</MenuItem>
	);
};

export default Drawing;
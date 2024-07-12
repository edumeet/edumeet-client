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
import { uiActions } from '../../store/slices/uiSlice'; // eslint-disable-line
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
	const drawingOpen = useAppSelector((state) => state.ui.drawingOpen);
	const drawingLabel = drawingOpen ? stopDrawingLabel() : startDrawingLabel();

	return (

		<MenuItem
			aria-label={drawingLabel}
			// disabled={!hasExtraVideoPermission}
			onClick={() => {
				onClick();

				// drawingOpen ? dispatch(unlock()) : dispatch(lock());
				dispatch(uiActions.setUi({ drawingOpen: !drawingOpen }));
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
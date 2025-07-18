import { MenuItem } from '@mui/material';
import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import {
	startDrawingLabel,
	stopDrawingLabel,
} from '../translated/translatedComponents';
import { MenuItemProps } from '../floatingmenu/FloatingMenu';
import MoreActions from '../moreactions/MoreActions';
import { enableDrawing, disableDrawing } from '../../store/actions/drawingActions';
import { permissions } from '../../utils/roles'; // eslint-disable-line
import DrawingIcon from '@mui/icons-material/Edit';

const Drawing = ({
	onClick
}: MenuItemProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const drawingEnabled = useAppSelector((state) => state.drawing.drawingEnabled);
	const drawingLabel = drawingEnabled ? stopDrawingLabel() : startDrawingLabel();

	return (

		<MenuItem
			aria-label={drawingLabel}
			// disabled={!hasExtraVideoPermission}
			onClick={() => {
				onClick();
				dispatch(!drawingEnabled ? enableDrawing() : disableDrawing());
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
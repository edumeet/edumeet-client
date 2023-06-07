import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { shareFileLabel } from '../translated/translatedComponents';
import { uiActions } from '../../store/slices/uiSlice';
import PulsingBadge from '../pulsingbadge/PulsingBadge';
import { filesLengthSelector } from '../../store/selectors';

const FilesharingButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const filesharingOpen = useAppSelector((state) => state.ui.filesharingOpen);
	const files = useAppSelector(filesLengthSelector);

	return (
		<ControlButton
			toolTip={shareFileLabel()}
			onClick={() => {
				dispatch(uiActions.setUi({ filesharingOpen: !filesharingOpen }));
			}}
			{ ...props }
		>
			<PulsingBadge
				color='primary'
				badgeContent={files}
			>
				<FileDownloadIcon />
			</PulsingBadge>
		</ControlButton>
	);
};

export default FilesharingButton;
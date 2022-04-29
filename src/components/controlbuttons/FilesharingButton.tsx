import {
	useAppDispatch,
	useAppSelector,
	usePermissionSelector
} from '../../store/hooks';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ControlButton, { ControlButtonProps } from './ControlButton';
import { shareFileLabel } from '../translated/translatedComponents';
import { uiActions } from '../../store/slices/uiSlice';
import { permissions } from '../../utils/roles';
import PulsingBadge from '../pulsingbadge/PulsingBadge';
import { filesLengthSelector } from '../../store/selectors';

const FilesharingButton = ({
	...props
}: ControlButtonProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const hasFilesharingPermission = usePermissionSelector(permissions.SHARE_FILE);
	const filesharingOpen = useAppSelector((state) => state.ui.filesharingOpen);
	const files = useAppSelector(filesLengthSelector);

	return (
		<ControlButton
			toolTip={shareFileLabel()}
			onClick={() => {
				dispatch(uiActions.setUi({ filesharingOpen: !filesharingOpen }));
			}}
			disabled={!hasFilesharingPermission}
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
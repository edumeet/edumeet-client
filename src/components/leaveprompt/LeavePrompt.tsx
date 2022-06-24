import {
	Button,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle
} from '@mui/material';
import {
	FC,
	ReactNode,
	useCallback,
	useRef,
	useState
} from 'react';
import { leaveRoom } from '../../store/actions/roomActions';
import { useAppDispatch } from '../../store/hooks';
import { LeavePromptContext } from '../../store/store';
import StyledDialog from '../dialog/StyledDialog';
import {
	confirmLeaveLabel,
	leaveRoomLabel,
	noLabel,
	yesLabel
} from '../translated/translatedComponents';

interface LeavePromptProps {
	children?: ReactNode;
}

export const LeavePrompt: FC<LeavePromptProps> = ({ children }) => {
	const dispatch = useAppDispatch();
	const cbReject = useRef<() => void>();
	const cbResolve = useRef<() => void>();
	const [ open, setOpen ] = useState(false);

	const showPrompt = useCallback(() =>
		new Promise<void>((resolve, reject) => {
			cbReject.current = reject;
			cbResolve.current = resolve;
			setOpen(true);
		}),
	[]);

	const close = useCallback(() => {
		if (cbReject.current)
			cbReject.current();

		setOpen(false);
	}, []);

	const confirm = useCallback(() => {
		if (cbResolve.current)
			cbResolve.current();

		dispatch(leaveRoom());

		setOpen(false);
	}, []);

	return (
		<LeavePromptContext.Provider value={showPrompt}>
			{ children }
			<StyledDialog open={open} onClose={close}>
				<DialogTitle>
					{ leaveRoomLabel() }
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{ confirmLeaveLabel() }
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						aria-label={noLabel()}
						onClick={close}
						variant='text'
					>
						{ noLabel() }
					</Button>
					<Button
						aria-label={yesLabel()}
						onClick={confirm}
						autoFocus
						variant='contained'
					>
						{ yesLabel() }
					</Button>
				</DialogActions>
			</StyledDialog>
		</LeavePromptContext.Provider>
	);
};
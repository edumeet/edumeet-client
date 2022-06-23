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
import { ConfirmLeaveMessage, LeaveRoomMessage, NoMessage, YesMessage } from '../translated/translatedComponents';

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
					<LeaveRoomMessage />
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						<ConfirmLeaveMessage />
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={close} variant='text'>
						<NoMessage />
					</Button>
					<Button onClick={confirm} autoFocus variant='contained'>
						<YesMessage />
					</Button>
				</DialogActions>
			</StyledDialog>
		</LeavePromptContext.Provider>
	);
};
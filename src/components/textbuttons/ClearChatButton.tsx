import { Button } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { clearChat } from '../../store/actions/chatActions';
import {
	clearChatLabel,
	ClearChatMessage
} from '../translated/translatedComponents';

const ClearChatButton = (): JSX.Element => {
	const dispatch = useAppDispatch();

	const handleClearChat = (): void => {
		dispatch(clearChat());
	};

	return (
		<Button
			aria-label={clearChatLabel()}
			color='error'
			variant='contained'
			onClick={handleClearChat}
		>
			<ClearChatMessage />
		</Button>
	);
};

export default ClearChatButton;
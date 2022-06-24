import { Send } from '@mui/icons-material';
import { IconButton, styled } from '@mui/material';
import { useState } from 'react';
import { sendChat } from '../../store/actions/chatActions';
import { useAppDispatch, usePermissionSelector } from '../../store/hooks';
import { permissions } from '../../utils/roles';
import TextInputField from '../textinputfield/TextInputField';
import { chatInputLabel } from '../translated/translatedComponents';

const ChatInputDiv = styled('div')(({ theme }) => ({
	marginLeft: theme.spacing(1),
	marginRight: theme.spacing(1),
}));

const ChatInput = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const [ message, setMessage ] = useState<string>('');
	const canChat = usePermissionSelector(permissions.SEND_CHAT);

	const handleSendMessage = () => {
		if (message.trim()) {
			dispatch(sendChat(message.trim()));
			setMessage('');
		}
	};

	return (
		<ChatInputDiv>
			<TextInputField
				label={chatInputLabel()}
				value={message}
				margin='dense'
				setValue={setMessage}
				onEnter={handleSendMessage}
				endAdornment={
					<IconButton
						aria-label={chatInputLabel()}
						size='small'
						disabled={!canChat || !message}
						onClick={handleSendMessage}
					>
						<Send />
					</IconButton>
				}
			/>
		</ChatInputDiv>
	);
};

export default ChatInput;
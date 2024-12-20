import { Send } from '@mui/icons-material';
import { IconButton, styled } from '@mui/material';
import { useState } from 'react';
import { sendChat } from '../../store/actions/chatActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import TextInputField from '../textinputfield/TextInputField';
import { chatInputLabel } from '../translated/translatedComponents';
import { fullscreenConsumerSelector } from '../../store/selectors';

const ChatInputDiv = styled('div')(({ theme }) => ({
	marginLeft: theme.spacing(1),
	marginRight: theme.spacing(1),
}));

const ChatInput = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const [ message, setMessage ] = useState<string>('');

	const handleSendMessage = () => {
		if (message.trim()) {
			dispatch(sendChat(message.trim()));
			setMessage('');
		}
	};

	const consumer = useAppSelector(fullscreenConsumerSelector);

	return (
		<ChatInputDiv>
			<TextInputField
				label={ consumer ? '' : chatInputLabel()}
				value={message}
				margin='dense'
				setValue={setMessage}
				onEnter={handleSendMessage}
				endAdornment={
					<IconButton
						aria-label={chatInputLabel()}
						size='small'
						disabled={!message}
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
import { Send } from '@mui/icons-material';
import { IconButton, styled } from '@mui/material';
import { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import TextInputField from '../textinputfield/TextInputField';
import { fullscreenConsumerSelector } from '../../store/selectors';
import { MAX_CHAT_MESSAGE_LENGTH } from '../../utils/types';

const ChatInputDiv = styled('div')(({ theme }) => ({
	marginLeft: theme.spacing(1),
	marginRight: theme.spacing(1),
}));

interface ChatInputProps {
	label: string;
	// eslint-disable-next-line no-unused-vars
	onSend: (message: string) => Promise<boolean>;
	disabled?: boolean;
}

const ChatInput = ({ label, onSend, disabled }: ChatInputProps): React.JSX.Element => {
	const [ message, setMessage ] = useState<string>('');

	const handleSendMessage = async () => {
		const text = message.trim();

		if (!text) return;

		setMessage('');

		const sent = await onSend(text);

		if (!sent) setMessage((current) => current || text);
	};

	const consumer = useAppSelector(fullscreenConsumerSelector);

	return (
		<ChatInputDiv>
			<TextInputField
				label={ consumer ? '' : label}
				value={message}
				margin='dense'
				maxLength={MAX_CHAT_MESSAGE_LENGTH}
				autoComplete='off'
				disabled={disabled}
				setValue={setMessage}
				onEnter={handleSendMessage}
				endAdornment={
					<IconButton
						aria-label={label}
						size='small'
						disabled={disabled || !message}
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

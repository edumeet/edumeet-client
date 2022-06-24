import { styled, Typography, useTheme } from '@mui/material';
import { FormattedTime } from 'react-intl';
import { meLabel } from '../translated/translatedComponents';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export type MessageFormat = 'single' | 'combinedBegin' | 'combinedMiddle' | 'combinedEnd';

const StyledMessage = styled('div')(({ theme }) => ({
	display: 'flex',
	flexShrink: 0,
	backgroundColor: theme.chatColor,
	boxShadow: theme.shadows[2],
	padding: theme.spacing(0),
	wordWrap: 'break-word',
	wordBreak: 'break-all',
	width: '66%',
}));

const StyledMessageAvatar = styled('div')({
	dispay: 'flex',
	width: '75px',
	display: 'flex',
	justifyContent: 'center',
	'& img': {
		borderRadius: '50%',
		width: '2rem',
		height: '2rem',
		alignSelf: 'center',
		objectFit: 'cover',
		backgroundColor: '#e0e0e085'
	}
});

const StyledMessageTime = styled('div')({
	width: '75px',
	alignSelf: 'center',
	fontSize: '13px',
	color: '#999999',
	dispay: 'flex',
	display: 'flex',
	justifyContent: 'center'
});

const StyledMessageContent = styled('div')(({ theme }) => ({
	margin: theme.spacing(1),
	'& p': {
		margin: '0'
	}
}));

const allowedHTMLNodes = {
	ALLOWED_TAGS: [
		'a', 'b', 'strong', 'i',
		'em', 'u', 'strike', 'p',
		'br'
	],
	ALLOWED_ATTR: [ 'href', 'target', 'title' ]
};

interface MessageProps {
	time?: number;
	name?: string;
	text?: string;
	isMe: boolean;
	format: MessageFormat;
}

const Message = ({
	time,
	name,
	text,
	isMe,
	format
}: MessageProps): JSX.Element => {
	const theme = useTheme();
	const linkRenderer = new marked.Renderer();

	linkRenderer.link = (href, title, linkText) => {
		title = title ? title : href;
		linkText = linkText ?? href;

		return `<a target='_blank' href='${href}' title='${title}'>${linkText}</a>`;
	};

	return (
		<StyledMessage
			sx={{
				...(isMe ? {
					alignSelf: 'flex-end'
				} : {
					alignSelf: 'flex-start'
				}),
				...(format === 'single' && {
					marginTop: theme.spacing(1),
					borderRadius: `${theme.shape.borderRadius}px`
				}),
				...(format === 'combinedBegin' && {
					marginTop: theme.spacing(1),
					borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0px 0px`,
					clipPath: `inset(-${theme.spacing(1)} -${theme.spacing(1)} 0px -${theme.spacing(1)})`
				}),
				...(format === 'combinedMiddle' && {
					marginBottom: theme.spacing(0),
					borderRadius: 0,
					clipPath: `inset(0px -${theme.spacing(1)} 0px -${theme.spacing(1)})`
				}),
				...(format === 'combinedEnd' && {
					marginBottom: theme.spacing(0),
					borderRadius: `0px 0px ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
					clipPath: `inset(0px -${theme.spacing(1)} -${theme.spacing(1)} -${theme.spacing(1)})`
				})
			}}
		>
			<StyledMessageAvatar>
				{ (format === 'single' || format ==='combinedBegin') ?
					<img alt='A' />
					:
					<StyledMessageTime>
						<FormattedTime value={new Date(time || Date.now())} />
					</StyledMessageTime>
				}
			</StyledMessageAvatar>
			<StyledMessageContent>
				{(format === 'single' || format ==='combinedBegin') &&
					<Typography variant='subtitle1'>
						<b>
							{ isMe ? meLabel() : <b>{name}</b> } - <FormattedTime
								value={new Date(time || Date.now())}
							/>
						</b>
					</Typography>
				}
				{ text &&
					<Typography
						variant='subtitle1'
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(
							marked.parse(text, { renderer: linkRenderer }),
							allowedHTMLNodes
						) }}
					/>
				}
			</StyledMessageContent>
		</StyledMessage>
	);
};

export default Message;
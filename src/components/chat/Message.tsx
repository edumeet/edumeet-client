import { styled, Typography } from '@mui/material';
import { FormattedTime } from 'react-intl';
import { meLabel } from '../translated/translatedComponents';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export type MessageFormat = 'single' | 'combinedBegin' | 'combinedMiddle' | 'combinedEnd';

type StyledMessageProps = {
	isMe: number;
	format?: MessageFormat;
};

const StyledMessage = styled('div')<StyledMessageProps>(({ isMe, format, theme }) => ({
	display: 'flex',
	backgroundColor: isMe ? theme.sideContentItemDarkColor : theme.sideContentItemColor,
	boxShadow: theme.shadows[2],
	padding: theme.spacing(0),
	wordWrap: 'break-word',
	wordBreak: 'break-all',
	width: '96%',
	...(isMe ? {
		alignSelf: 'flex-end',
	} : {
		alignSelf: 'flex-start',
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
}));

const StyledMessageAvatar = styled('div')(({ theme }) => ({
	dispay: 'flex',
	width: theme.spacing(6),
	display: 'flex',
	justifyContent: 'center',
	'& img': {
		borderRadius: '50%',
		width: theme.spacing(3),
		height: theme.spacing(3),
		alignSelf: 'center',
		objectFit: 'cover',
		backgroundColor: '#e0e0e085'
	}
}));

const StyledMessageTime = styled('div')(({ theme }) => ({
	display: 'flex',
	alignSelf: 'center',
	justifyContent: 'center',
	fontSize: theme.typography.caption.fontSize,
	color: theme.palette.text.disabled,
}));

type StyledMessageContentProps = {
	marginTop: number;
	marginBottom: number;
};

const StyledMessageContent = styled('div')<StyledMessageContentProps>(({
	marginTop,
	marginBottom,
	theme,
}) => ({
	marginRight: theme.spacing(0.5),
	marginTop: marginTop ? theme.spacing(0.5) : 0,
	marginBottom: marginBottom ? theme.spacing(0.5) : 0,
	'& p': {
		margin: '0'
	}
}));

const allowedHTMLNodes = {
	ALLOWED_TAGS: [ 'a', 'b', 'strong', 'i', 'em', 'u', 'strike', 'p', 'br' ],
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
	const linkRenderer = new marked.Renderer();

	linkRenderer.link = (href, title, linkText) => {
		title = title ? title : href;
		linkText = linkText ?? href;

		return `<a target='_blank' href='${href}' title='${title}'>${linkText}</a>`;
	};

	return (
		<StyledMessage isMe={isMe ? 1 : 0} format={format}>
			<StyledMessageAvatar>
				{ (format === 'single' || format ==='combinedBegin') ?
					<img alt='A' src='/images/buddy.svg' />
					:
					<StyledMessageTime>
						<FormattedTime value={new Date(time || Date.now())} hour12={false} />
					</StyledMessageTime>
				}
			</StyledMessageAvatar>
			<StyledMessageContent
				marginTop={format === 'single' || format === 'combinedBegin' ? 1 : 0}
				marginBottom={format === 'single' || format === 'combinedEnd' ? 1 : 0}
			>
				{(format === 'single' || format ==='combinedBegin') &&
					<>
						<Typography variant='body2' display='flex'>
							<b>{ isMe ? meLabel() : name }</b><StyledMessageTime>
								&nbsp;- { <FormattedTime value={new Date(time || Date.now())} hour12={false}/> }
							</StyledMessageTime>
						</Typography>
					</>
				}
				{ text &&
					<Typography
						variant='body2'
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

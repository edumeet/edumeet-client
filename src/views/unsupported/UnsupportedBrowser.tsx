import {
	Avatar,
	Box,
	DialogContent,
	DialogTitle,
	Grid,
	Hidden,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText
} from '@mui/material';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import ErrorIcon from '@mui/icons-material/Error';
import { FormattedMessage } from 'react-intl';
import StyledDialog from '../../components/dialog/StyledDialog';
import { memo } from 'react';

interface UnsupportedBrowserProps {
	platform: string;
	webrtcUnavailable?: boolean;
}

const supportedBrowsers = [
	{ name: 'Chrome/Chromium', version: '74', vendor: 'Google' },
	{ name: 'Edge', version: '18', vendor: 'Microsoft' },
	{ name: 'Firefox', version: '60', vendor: 'Mozilla' },
	{ name: 'Safari', version: '12', vendor: 'Apple' },
	{ name: 'Opera', version: '62', vendor: '' },
	{ name: 'Samsung Internet', version: '11.1.1.52', vendor: '' },
];

let dense = false;

const UnsupportedBrowser = ({
	platform,
	webrtcUnavailable,
}: UnsupportedBrowserProps): JSX.Element => {
	if (platform !== 'desktop')
		dense = true;

	return (
		<StyledDialog
			open
			scroll={'body'}
		>
			<DialogTitle id='form-dialog-title'>
				{!webrtcUnavailable &&
				<FormattedMessage
					id='unsupportedBrowser.titleUnsupportedBrowser'
					defaultMessage='Browser not supported'
				/>
				}
				{webrtcUnavailable &&
				<FormattedMessage
					id='unsupportedBrowser.titlewebrtcUnavailable'
					defaultMessage='Required functionality not availble in your browser'
				/>
				}
			</DialogTitle>
			<DialogContent dividers>
				<FormattedMessage
					id='unsupportedBrowser.bodyText'
					defaultMessage='This meeting service requires
						functionality not supported by your browser.
						Please upgrade, switch to a different browser, or
						check your settings. Supported browsers:'
				/>
				<Grid container spacing={2}>
					<Grid item xs={12} md={7}>

						<Box sx={{
							backgroundColor: 'background.paper'
						}}>
							<List dense={dense}>
								{ supportedBrowsers.map((browser, index) => {
									const supportedBrowser = `${browser.vendor} ${browser.name}`;
									const supportedVersion = `${browser.version}+`;

									return (
										<ListItem key={index}>
											<ListItemAvatar>
												<Avatar>
													<WebAssetIcon />
												</Avatar>
											</ListItemAvatar>
											<ListItemText
												primary={supportedBrowser}
												secondary={supportedVersion}
											/>
										</ListItem>
									);
								})}
							</List>
						</Box>
					</Grid>
					<Grid item xs={12} md={5}>
						<Hidden mdDown>
							<ErrorIcon color='error'/>
						</Hidden>
					</Grid>
				</Grid>
			</DialogContent>
		</StyledDialog>
	);
};

export default memo(UnsupportedBrowser);
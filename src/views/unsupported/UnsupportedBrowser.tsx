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
	ListItemText,
	Link,
	Typography
} from '@mui/material';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import ErrorIcon from '@mui/icons-material/Error';
import { FormattedMessage } from 'react-intl';
import { memo } from 'react';
import { RawStyledDialog } from '../../components/genericdialog/GenericDialog';
import { imprintLabel, privacyLabel } from '../../components/translated/translatedComponents';
import edumeetConfig from '../../utils/edumeetConfig';

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
}: UnsupportedBrowserProps): React.JSX.Element => {
	if (platform !== 'desktop')
		dense = true;

	const privacyUrl = edumeetConfig.privacyUrl ?? '';
	const imprintUrl = edumeetConfig.imprintUrl ?? '';

	return (
		<RawStyledDialog
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
				<Box display="flex" alignItems="left">
					{imprintUrl.trim() !== '' && (
						<Link href={imprintUrl} target="_blank" color="inherit" underline="none">
							<Typography variant="body2">{ imprintLabel() }</Typography>
						</Link>
					)}
					{privacyUrl.trim() !== '' && (
						<Link href={privacyUrl} target="_blank" color="inherit" underline="none" style={{ marginLeft: '16px' }}>
							<Typography variant="body2">{ privacyLabel() }</Typography>
						</Link>
					)}
				</Box>
			</DialogContent>
		</RawStyledDialog>
	);
};

export default memo(UnsupportedBrowser);

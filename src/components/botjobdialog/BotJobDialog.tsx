import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { uiActions } from '../../store/slices/uiSlice';
import { startBotJob } from '../../store/actions/botJobActions';
import GenericDialog from '../genericdialog/GenericDialog';
import { botJobE2eeNoticeLabel, botJobProviderLabel, noLabel, yesLabel } from '../translated/translatedComponents';
import { botJobConfirmLabel, botJobDeliveryNoticeLabel, botJobStartLabel } from '../../utils/botJobLabels';

// A job brings a recorder, streamer or transcriber into the room, so starting one
// is always confirmed, and in an encrypted room says what that means for the
// encryption. A tenant with two providers of a kind has the moderator pick one.
const BotJobDialog = (): React.JSX.Element | null => {
	useAppSelector((state) => state.settings.locale);
	const dispatch = useAppDispatch();
	const type = useAppSelector((state) => state.ui.botJobDialog);
	const providers = useAppSelector((state) => state.botJobs.providers);
	const e2eeEnabled = useAppSelector((state) => state.room.e2eeEnabled);
	const [ providerId, setProviderId ] = useState<number | undefined>();
	const candidates = providers.filter((provider) => provider.jobType === type);
	const provider = candidates.find((candidate) => candidate.id === providerId) ?? candidates[0];

	useEffect(() => setProviderId(undefined), [ type ]);

	if (!type || !provider) return null;

	const close = (): void => {
		dispatch(uiActions.setUi({ botJobDialog: undefined }));
	};

	const start = (): void => {
		close();
		dispatch(startBotJob(type, provider.id));
	};

	return (
		<GenericDialog
			open
			onClose={close}
			maxWidth='xs'
			title={botJobStartLabel(type)}
			content={
				<Stack spacing={2} sx={{ paddingTop: 1 }}>
					{ candidates.length > 1 &&
						<TextField
							select
							size='small'
							label={botJobProviderLabel()}
							value={provider.id}
							onChange={(event) => setProviderId(Number(event.target.value))}
						>
							{ candidates.map((candidate) => (
								<MenuItem key={candidate.id} value={candidate.id}>{ candidate.label }</MenuItem>
							)) }
						</TextField>
					}
					<Typography>{ botJobConfirmLabel(type, provider.label) }</Typography>
					<Typography variant='body2'>{ botJobDeliveryNoticeLabel(type) }</Typography>
					{ e2eeEnabled && <Alert severity='warning'>{ botJobE2eeNoticeLabel() }</Alert> }
				</Stack>
			}
			actions={
				<>
					<Button onClick={close} variant='outlined'>{ noLabel() }</Button>
					<Button onClick={start} variant='contained' color='error'>{ yesLabel() }</Button>
				</>
			}
		/>
	);
};

export default BotJobDialog;

import { useRouteError } from 'react-router-dom';
import { Logger } from 'edumeet-common';
import { useAppDispatch } from '../../store/hooks';
import { RawStyledDialog } from '../../components/genericdialog/GenericDialog';
import { DialogTitle } from '@mui/material';
import { generalErrorLabel } from '../../components/translated/translatedComponents';
import { useEffect } from 'react';
import { leaveRoom } from '../../store/actions/roomActions';

const logger = new Logger('ErrorBoundary');

const ErrorBoundary = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const error = useRouteError();

	logger.error(error);

	useEffect(() => {
		dispatch(leaveRoom());

		const reloadTimeout = setTimeout(() => location.reload(), 5000);

		return () => clearTimeout(reloadTimeout);
	}, []);

	return (
		<RawStyledDialog
			open
			scroll={'body'}
		>
			<DialogTitle id='form-dialog-title'>
				{ generalErrorLabel() }
			</DialogTitle>
		</RawStyledDialog>
	);
};

export default ErrorBoundary;
import {
	Button,
	DialogActions,
	DialogTitle,
	Stack,
	Tabs
} from '@mui/material';
import {
	closeLabel,
	statsLabel,
} from '../translated/translatedComponents';
import { Close } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { StatsTab, uiActions } from '../../store/slices/uiSlice';
import StyledDialog from '../dialog/StyledDialog';
import React from 'react';
import GeneralStats from './GeneralStats';

const tabs: StatsTab[] = [
	'general'
];

const StatsDialog = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const statsOpen = useAppSelector((state) => state.ui.statsOpen);
	const currentStatsTab = useAppSelector((state) => state.ui.currentStatsTab);

	const handleCloseStats = (): void => {
		dispatch(uiActions.setUi({
			statsOpen: !statsOpen
		}));
	};

	return (
		<StyledDialog
			open={ statsOpen }
			onClose={ handleCloseStats }
			maxWidth='md'
		>
			<DialogTitle>
				{ statsLabel() }
			</DialogTitle>
			<Tabs
				value={ tabs.indexOf(currentStatsTab) }
				onChange={ (_event, value) =>
					dispatch(uiActions.setCurrentStatsTab(tabs[value]))
				}
				variant='fullWidth'
			>
			</Tabs>
			{ currentStatsTab === 'general' && <GeneralStats /> }
			<Stack direction='column' spacing={ 2 }>
			</Stack>
			<DialogActions>
				<Button
					onClick={ handleCloseStats }
					startIcon={ <Close /> }
				>
					{ closeLabel() }
				</Button>
			</DialogActions>
		</StyledDialog>
	);
};

export default StatsDialog;
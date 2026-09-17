import { Box, Chip, List, ListItem, ListItemText, Popover, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { memo, useState } from 'react';
import { useAppDispatch, useAppSelector, usePermissionSelector } from '../../store/hooks';
import { botsSelector } from '../../store/selectors';
import { kickPeer } from '../../store/actions/peerActions';
import { permissions } from '../../utils/roles';
import ConfirmButton from '../textbuttons/ConfirmButton';
import {
	botsInRoomLabel,
	kickLabel,
	removeBotConfirmLabel,
	removeBotLabel,
	removeBotsConfirmLabel,
	removeBotsLabel,
} from '../translated/translatedComponents';

// Carries its own spacing so the top bar has nothing to lay out when there are no bots.
const StyledChip = styled(Chip)(({ theme }) => ({
	marginRight: theme.spacing(1),
	color: 'white',
	backgroundColor: 'rgba(128, 128, 128, 0.5)',
	'& .MuiChip-icon': {
		color: 'white',
	},
}));

const Panel = styled(Box)(({ theme }) => ({
	padding: theme.spacing(2),
	minWidth: 280,
}));

const Row = styled(ListItem)(({ theme }) => ({
	gap: theme.spacing(2),
}));

// Recorder and streamer pages are kept out of the participant list and the
// count, so this is the one place that discloses them: how many, and who. It is
// also the only place a moderator can remove them from.
const BotsIndicator = (): React.JSX.Element | null => {
	useAppSelector((state) => state.settings.locale);
	const dispatch = useAppDispatch();
	const bots = useAppSelector(botsSelector);
	const canModerate = usePermissionSelector(permissions.MODERATE_ROOM);
	const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);

	if (bots.length === 0) return null;

	const nameOf = (bot: { id: string, displayName?: string }): string => bot.displayName || bot.id;

	if (!canModerate) {
		return (
			<Tooltip title={`${botsInRoomLabel()}: ${bots.map(nameOf).join(', ')}`}>
				<StyledChip size='small' icon={<SmartToyOutlinedIcon />} label={bots.length} />
			</Tooltip>
		);
	}

	const remove = (ids: string[]): void => {
		setAnchorEl(null);
		ids.forEach((id) => dispatch(kickPeer(id)));
	};

	return (
		<>
			<Tooltip title={botsInRoomLabel()}>
				<StyledChip
					size='small'
					icon={<SmartToyOutlinedIcon />}
					label={bots.length}
					onClick={(event) => setAnchorEl(event.currentTarget)}
				/>
			</Tooltip>
			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				transformOrigin={{ vertical: 'top', horizontal: 'center' }}
			>
				<Panel>
					<Typography variant='subtitle2'>{ botsInRoomLabel() }</Typography>
					<List dense>
						{ bots.map((bot) => (
							<Row key={bot.id} disableGutters>
								<ListItemText primary={nameOf(bot)} />
								<ConfirmButton
									size='small'
									variant='outlined'
									label={kickLabel()}
									confirmTitle={removeBotLabel(nameOf(bot))}
									confirmContent={<Typography>{ removeBotConfirmLabel(nameOf(bot)) }</Typography>}
									onConfirm={() => remove([ bot.id ])}
								/>
							</Row>
						)) }
					</List>
					{ bots.length > 1 &&
						<ConfirmButton
							size='small'
							label={removeBotsLabel()}
							confirmContent={<Typography>{ removeBotsConfirmLabel() }</Typography>}
							onConfirm={() => remove(bots.map((bot) => bot.id))}
						/>
					}
				</Panel>
			</Popover>
		</>
	);
};

export default memo(BotsIndicator);

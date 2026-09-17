import { Chip, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { memo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { botsSelector } from '../../store/selectors';
import { botsInRoomLabel } from '../translated/translatedComponents';

// Carries its own spacing so the top bar has nothing to lay out when there are no bots.
const StyledChip = styled(Chip)(({ theme }) => ({
	marginRight: theme.spacing(1),
	color: 'white',
	backgroundColor: 'rgba(128, 128, 128, 0.5)',
	'& .MuiChip-icon': {
		color: 'white',
	},
}));

// Recorder and streamer pages are kept out of the participant list and the
// count, so this is the one place that discloses them: how many, and who.
const BotsIndicator = (): React.JSX.Element | null => {
	useAppSelector((state) => state.settings.locale);
	const bots = useAppSelector(botsSelector);

	if (bots.length === 0) return null;

	const names = bots.map((bot) => bot.displayName || bot.id).join(', ');

	return (
		<Tooltip title={`${botsInRoomLabel()}: ${names}`}>
			<StyledChip size='small' icon={<SmartToyOutlinedIcon />} label={bots.length} />
		</Tooltip>
	);
};

export default memo(BotsIndicator);

import { Paper, Stack, styled } from '@mui/material';
import {
	filesharingLabel,
	lockRoomLabel,
	muteAudioLabel,
	openSettingsLabel,
	raiseHandLabel,
	showChatLabel,
	showParticipantsLabel,
	showStatsLabel,
	stopVideoLabel,
	usePTTLabel
} from '../translated/translatedComponents';

// shortcut keys get from startAction.tsx
const shortcuts: Array<{ value: string, label: () => string }> = [ {
	value: 'M',
	label: muteAudioLabel
},
{
	value: 'V',
	label: stopVideoLabel
},
{
	value: 'R',
	label: raiseHandLabel
},
{
	value: 'S',
	label: openSettingsLabel,
},
{
	value: 'D',
	label: filesharingLabel
},
{
	value: 'L',
	label: lockRoomLabel
},
{
	value: 'P',
	label: showParticipantsLabel,
},
{
	value: 'C',
	label: showChatLabel
},
{
	value: 'Q',
	label: showStatsLabel
},
{
	value: 'SPACE',
	label: usePTTLabel
} ];

const StyledDiv = styled('div')(({ theme }) => ({
	display: 'flex',
	flexDirection: 'row',
	width: '100%',
	padding: theme.spacing(0, 2),
	':first-child': {
		marginTop: theme.spacing(2)
	},
	':last-child': {
		marginBottom: theme.spacing(2)
	},
	'.MuiPaper-root': {
		width: '75px',
		textAlign: 'center',
		padding: theme.spacing(0.2, 0.5),
		marginRight: theme.spacing(2)
	}
}));

const ShortcutKeys = (): JSX.Element => {
	return (
		<Stack direction='column' spacing={ 2 }>
			{ shortcuts.map(({ value, label }, index) => (
				<StyledDiv key={ index }>
					<Paper>{ value }</Paper>
					<label style={{ margin: 'auto 0' }}>{ label() }</label>
				</StyledDiv>
			)) }
		</Stack>
	);
};

export default ShortcutKeys;
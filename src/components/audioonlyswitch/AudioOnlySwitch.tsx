import { SpatialAudio } from '@mui/icons-material';
import { FormControlLabel, styled, Switch } from '@mui/material';
import { audioOnlyModeLabel } from '../translated/translatedComponents';

interface AudioOnlyProps {
	checked: boolean;
	disabled: boolean;
	// eslint-disable-next-line
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const StyledDiv = styled('div')(({ theme }) => ({
	width: '100%',
	display: 'flex',
	padding: theme.spacing(1, 0),
	'.MuiSvgIcon-root': {
		margin: 'auto'
	}
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
	width: '100%',
	justifyContent: 'space-between',
	marginLeft: theme.spacing(1)
}));

const AudioOnlySwitch = ({
	checked,
	disabled,
	onChange
}: AudioOnlyProps): JSX.Element => {
	return (
		<StyledDiv>
			<SpatialAudio />
			<StyledFormControlLabel
				control={
					<Switch
						data-testid='audioonly-switch'
						color='primary'
						checked={ checked }
						disabled={ disabled }
						onChange={ onChange }
					/>
				}
				label={ audioOnlyModeLabel() }
				labelPlacement='start'
			/>
		</StyledDiv>
	);
};

export default AudioOnlySwitch;
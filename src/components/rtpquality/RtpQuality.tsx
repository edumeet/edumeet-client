import { SignalCellular0Bar, SignalCellular1Bar, SignalCellular2Bar, SignalCellular3Bar, SignalCellularOff } from '@mui/icons-material';
import { styled } from '@mui/material';
import { orange, red, yellow } from '@mui/material/colors';
import { Logger } from 'edumeet-common';

const logger = new Logger('RTPQuality');

const RTPQualityContainer = styled('div')(({ theme }) => ({
	position: 'absolute',
	width: theme.spacing(5),
	height: theme.spacing(5),
	top: 5,
	right: 5,
	zIndex: 21,
	backgroundColor: 'black'
}));

interface RTPQualityProps {
	score: number;
}

const RTPQuality = ({
	score,
}: RTPQualityProps): React.JSX.Element => {
	let qualityElement = <SignalCellularOff style={{ color: red[500] }} fontSize='large'/>;

	logger.debug(score);

	switch (score) {
		case 0:
		case 1:
		{
			qualityElement = <SignalCellular0Bar style={{ color: red[500] }} fontSize='large'/>;
			break;
		}
		case 2:
		case 3:
		{
			qualityElement = <SignalCellular1Bar style={{ color: red[500] }} fontSize='large'/>;
			break;

		}				
		case 4:
		case 5:
		case 6:
		{
			qualityElement = <SignalCellular2Bar style={{ color: orange[500] }}fontSize='large'/>;
			break;

		}				
		case 7:
		case 8:
		case 9:
		{
			qualityElement = <SignalCellular3Bar style={{ color: yellow[500] }}fontSize='large' sx={{ bccolor: 'transparent' }}/>;
			break;

		}				
	}
	logger.debug(qualityElement);

	return (
		<RTPQualityContainer>
			{ qualityElement}
		</RTPQualityContainer>
	);
};

export default RTPQuality;
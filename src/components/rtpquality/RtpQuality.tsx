import { SignalCellular0Bar, SignalCellular1Bar, SignalCellular2Bar, SignalCellular3Bar, SignalCellularOff } from '@mui/icons-material';
import { styled } from '@mui/material';
import { orange, red, yellow } from '@mui/material/colors';
import { isMobileSelector } from '../../store/selectors';
import { useAppSelector } from '../../store/hooks';
import { cloneElement } from 'react';

type RTPQualityContainerProps = {
	size: number,
	borderColor: string,
	backgroundColor: string,
	borderWidth: string 
}

const RTPQualityContainer = styled('div')<RTPQualityContainerProps>(({ theme, size, borderColor, backgroundColor, borderWidth }) => ({
	position: 'absolute',
	width: theme.spacing(size),
	height: theme.spacing(size),
	top: 5,
	right: 5,
	zIndex: 21,
	backgroundColor,
	borderColor,
	borderWidth,
	borderStyle: 'solid'
}));

interface RTPQualityProps {
	score: number;
}

const RTPQuality = ({
	score,
}: RTPQualityProps): React.JSX.Element => {
	const isMobile = useAppSelector(isMobileSelector);
	let qualityElement = undefined;
	let borderColor = '';

	const backgroundColor = 'rgba(0,0,0,0.2)';
	const fontSize = isMobile ? 'medium' : 'large'; 
	const borderWidth = isMobile ? '1px': '2px';
	const containerSize = isMobile ? 3.2 : 4.7;

	switch (score) {
		case 0:
		case 1:
		{
			qualityElement = <SignalCellular0Bar style={{ color: red[400] }} />;
			borderColor = red[400];
			break;
		}
		case 2:
		case 3:
		{
			qualityElement = <SignalCellular1Bar style={{ color: red[400] }} />;
			borderColor = red[400];
			break;
		}				
		case 4:
		case 5:
		case 6:
		{
			qualityElement = <SignalCellular2Bar style={{ color: orange[400] }} />;
			borderColor = orange[400];
			break;
		}				
		case 7:
		case 8:
		case 9:
		{
			qualityElement = <SignalCellular3Bar style={{ color: yellow[400] }} />;
			borderColor = yellow[400];
			break;
		}				
	}

	if (qualityElement)	qualityElement = cloneElement(qualityElement, { fontSize });

	return (
		<>
			{qualityElement && (
				<RTPQualityContainer size={containerSize} borderColor={borderColor} backgroundColor={backgroundColor} borderWidth={borderWidth
				}>
					{ qualityElement}
				</RTPQualityContainer>
			)}
		</>
	);
};

export default RTPQuality;
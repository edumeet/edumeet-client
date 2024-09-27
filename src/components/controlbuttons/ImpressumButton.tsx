import InfoIcon from '@mui/icons-material/Info';
import React from 'react';
import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import edumeetConfig from '../../utils/edumeetConfig';

const ImpressumContainer = styled(Box)(({ theme }) => ({
	position: 'absolute',
	bottom: theme.spacing(1.5),
	left: theme.spacing(1.5),
	color: 'white',
}));

const impressumUrl = edumeetConfig.impressumUrl;

const ImpressumButton: React.FC = () => {
	return (
		<div>
			<ImpressumContainer>
				<Button target="_blank" href={impressumUrl} variant="text" color="primary" title='Privacy info' >
					<InfoIcon />
					
				</Button>
			</ImpressumContainer>
		</div>
	);
};

export default ImpressumButton;
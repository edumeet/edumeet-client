import { Box, styled } from '@mui/material';

type GhostObjectProps = {
	children: React.ReactNode;
  };

// eslint-disable-next-line no-empty-pattern
const GhostDiv = styled(Box)(({ }) => ({
	opacity: 0.7,
	animation: 'pulse 3s ease-in-out 0.5s infinite',
    
	'@keyframes pulse': {
		'0%': {
			opacity: 0.9,
		},
        
		'50%': {
			opacity: 0.6,
		},
        
		'100%': {
			opacity: 0.9,
		},
	}
}));

// Pulsing object wrapper to show were peers wil be dropped
const GhostObject = ({ children }: GhostObjectProps): JSX.Element => {

	return (
		<GhostDiv>
			{children}
		</GhostDiv>
	);
};

export default GhostObject;
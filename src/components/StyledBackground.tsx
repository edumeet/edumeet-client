import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export default styled(Box)(({ theme }) => ({
	display: 'flex',
	width: '100%',
	height: '100%',
	backgroundImage: `url(${theme.backgroundImage})`,
	backgroundAttachment: 'fixed',
	backgroundPosition: 'center',
	backgroundSize: 'cover',
	backgroundRepeat: 'no-repeat'
}));
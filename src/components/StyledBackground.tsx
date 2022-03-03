import { Box } from '@mui/material';
import { styled } from '@mui/system';
import edumeetConfig from '../utils/edumeetConfig';

export default styled(Box)({
	display: 'flex',
	width: '100%',
	height: '100%',
	backgroundImage: `url(${edumeetConfig.background})`,
	backgroundAttachment: 'fixed',
	backgroundPosition: 'center',
	backgroundSize: 'cover',
	backgroundRepeat: 'no-repeat'
});
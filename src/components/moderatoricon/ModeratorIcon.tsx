import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import IndicatorTooltip from '../indicatortooltip/IndicatorTooltip';
import { moderatorLabel } from '../translated/translatedComponents';

// Marks a participant who moderates the room, so everyone can see who controls it. A person with a
// cog rather than a shield, as the end-to-end encryption indicator beside it is a shield.
const ModeratorIcon = (): React.JSX.Element => (
	<IndicatorTooltip title={moderatorLabel()}>
		<ManageAccountsOutlinedIcon
			fontSize='small'
			color='primary'
			aria-label={moderatorLabel()}
			aria-hidden={false}
			role='img'
			sx={{ alignSelf: 'center', ml: 0.5 }}
			onClick={(event) => event.stopPropagation()}
		/>
	</IndicatorTooltip>
);

export default ModeratorIcon;

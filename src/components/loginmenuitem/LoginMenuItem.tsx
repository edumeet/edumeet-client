import { AccountCircle } from '@mui/icons-material';
import { MenuItem } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { permissionsActions } from '../../store/slices/permissionsSlice';
import MoreActions from '../moreactions/MoreActions';

interface LoginMenuProps {
	onClick: () => void;
}

const LoginMenuItem = ({ onClick }: LoginMenuProps) => {
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const dispatch = useAppDispatch();
	const intl = useIntl();

	const itemOnClick = () => {
		onClick();
		dispatch(permissionsActions.setLoggedIn({ loggedIn: !loggedIn }));
	};

	const loginTooltip = loggedIn ?
		intl.formatMessage({
			id: 'tooltip.logout',
			defaultMessage: 'Log out'
		})
		:
		intl.formatMessage({
			id: 'tooltip.login',
			defaultMessage: 'Log in'
		});

	return (
		loginEnabled &&
			<MenuItem
				aria-label={loginTooltip}
				onClick={itemOnClick}
			>
				<AccountCircle />
				{ loggedIn ?
					<MoreActions>
						<FormattedMessage
							id='tooltip.logout'
							defaultMessage='Log out'
						/>
					</MoreActions>
					:
					<MoreActions>
						<FormattedMessage
							id='tooltip.login'
							defaultMessage='Log in'
						/>
					</MoreActions>
				}
			</MenuItem>
	);
};

export default LoginMenuItem;
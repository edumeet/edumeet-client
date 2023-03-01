import { styled, Badge, Grid, Chip, Typography, Button, useTheme } from '@mui/material';
// import CreateTablesSessionButton from '../textbuttons/CreateTablesSessionButton';
// import CloseTablesSessionButton from '../textbuttons/CloseTablesSessionButton';
import { useAppSelector } from '../../store/hooks';
import { menuLabel } from '../translated/translatedComponents';
import { FormattedMessage } from 'react-intl';

import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonIcon from '@mui/icons-material/Person';
import TelegramIcon from '@mui/icons-material/Telegram';

const ListUl = styled('ul')(({ theme }) => ({
	listStyleType: 'none',
	padding: theme.spacing(1),
	boxShadow: '0 2px 5px 2px rgba(0, 0, 0, 0.2)',
	backgroundColor: 'rgba(255, 255, 255, 1)'
}));

const ListHeaderLi = styled('li')({
	fontWeight: 'bolder'
});

const ListItemLi = styled('li')({
	width: '100%',
	overflow: 'hidden',
	cursor: 'pointer',
	'&:not(:last-child)': {
		borderBottom: '1px solid #CBCBCB'
	}
});

const StyledBadge = styled(Badge)({
	padding: '0 4px'
});

const List = () => {
	const theme = useTheme();
	const tables = useAppSelector((state) => state.tables);

	return (
		//  TABLES
		<Grid 
			container 
			// className={classes.root}
			style={{
				margin: theme.spacing(0),
				marginTop: theme.spacing(1)
			}}
		>
			{
				tables.list.map((table, i) => {
					/* TABLE */
					return (
						<Grid
							container
							item 
							key={i}
							border={
								tables.current === table.id ? 
									'1px solid #5F9B2D' : undefined
							}
							margin={theme.spacing(0)}
							marginTop={ theme.spacing(1)}
							marginRight={ theme.spacing(1)}
							padding={ theme.spacing(2)}
							bgcolor='#f1f1f1'		
						>
							{/* HEADER */}
							<Grid 
								container 
								item
								justifyContent='space-between'
								alignItems='center'
							>
								<Grid 
									item 
									container 
									justifyContent='space-between'
									flexBasis='85px'
								>
									{/* TABLE NAME */}
									<Typography style={{ fontWeight: 'bold' }}>
										<FormattedMessage
											id='mingleRooms.table'
											defaultMessage='{type} {number}'
											values={{
												type: table.type,
												number: ++i
											}}
										/>
									</Typography>
									{/* /TABLE NAME */}

									{/* PEERS NUMBER */}
									<StyledBadge 
										badgeContent={table.users.length} 
										color='error'
									>
										<PeopleAltIcon fontSize='small'/>
									</StyledBadge>
									{/* /PEERS NUMBER */}
								</Grid>
								{tables.current !== table.id &&
								<Grid item>
									{/* JOIN BUTTON */}
									<Button
										variant='contained'
										color='error'
										size='small'
										endIcon={<TelegramIcon />}
										href={table.url}
										// onClick={() => roomClient.joinToMingleRoom(table.name, table.hash)}
										// aria-label={intl.formatMessage({
										// 	id: 'mingleRooms.join',
										// 	defaultMessage: 'Join'
										// })}
									>
										<FormattedMessage
											id='mingleRooms.join'
											defaultMessage='Join'
										/>
									</Button>
									{/* /JOIN BUTTON */}
								</Grid>
								}
							</Grid>
							{/* /HEADER */}

							{/* BODY */}
							<Grid 
								container 
								item
							>
								{/* PEERS */}
								{ table.users.map((user) => (
									<Chip
										key={user.id}
										// className={classes.name}
										style={{
											margin: theme.spacing(1, 1, 0, 0),
										}}
										icon={<PersonIcon/>}
										label={user.name}
									/>
								))}
								{/* /PEERS */}
							</Grid>
							{/* /BODY */}
						</Grid>

					);

					/* /TABLE */
				})
			}
		</Grid>
		//  /TABLES

	);
};

const TablesList = (): JSX.Element => {
	return (
		<ListUl>
			<ListHeaderLi>
				{ menuLabel() }
			</ListHeaderLi>
			<ListItemLi>
				<List/>
			</ListItemLi>
		</ListUl>
	);
};

export default TablesList;
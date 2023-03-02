import { Button, styled } from '@mui/material';
import { useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import ScrollingList from '../scrollinglist/ScrollingList';
import { chatScrollToBottomLabel, joinLabel } from '../translated/translatedComponents';

import { Badge, Grid, Chip, Typography, useTheme, Collapse } from '@mui/material';
import { FormattedMessage } from 'react-intl';

import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonIcon from '@mui/icons-material/Person';
import TelegramIcon from '@mui/icons-material/Telegram';

const ScrollToBottom = styled(Button)(({ theme }) => ({
	marginLeft: theme.spacing(4),
	marginRight: theme.spacing(4),
	marginBottom: theme.spacing(1),
}));

const StyledBadge = styled(Badge)({
	padding: '0 4px'
});

const TableList = (): JSX.Element => {
	const list = useRef<ScrollingList>(null);
	const [ atBottom, setAtBottom ] = useState(true);
	const theme = useTheme();
	const tables = useAppSelector((state) => state.tables);
	const created = useAppSelector((state) => state.tables.created);

	return (
		<>
			<ScrollingList
				ref={list}
				onScroll={(isAtBottom: boolean) => {
					setAtBottom(isAtBottom);
				}}
			>
				<Collapse in={created}> 
					{ tables.list.map((table, i) => {
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
										flexBasis='90px'
									>
										{/* TABLE NAME */}
										<Typography style={{ fontWeight: 'bold' }}>
											<FormattedMessage
												id='tables.tableName'
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
										aria-label={joinLabel()}
										onClick={() => null}
									>
										{joinLabel()}
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
				</Collapse>

			</ScrollingList>
			{ !atBottom &&
				<ScrollToBottom
					variant='contained'
					onClick={() => list.current?.scrollToBottom()}
				>
					{ chatScrollToBottomLabel() }
				</ScrollToBottom>
			}
		</>
		
	);
};

export default TableList;
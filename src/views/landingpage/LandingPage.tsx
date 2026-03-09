import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Box, Link, Typography, MenuItem, Select, InputLabel, FormControl, Tab, Tabs } from '@mui/material'; import randomString from 'random-string';
import TextInputField from '../../components/textinputfield/TextInputField';
import { joinLabel, roomNameLabel, imprintLabel, privacyLabel } from '../../components/translated/translatedComponents';
import GenericDialog from '../../components/genericdialog/GenericDialog';
import StyledBackground from '../../components/StyledBackground';
import PrecallTitle from '../../components/precalltitle/PrecallTitle';
import { QRCode } from 'react-qrcode-logo';
import edumeetConfig from '../../utils/edumeetConfig';
import { startListeners, stopListeners } from '../../store/actions/startActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getData } from '../../store/actions/managementActions';

const LandingPage = (): React.JSX.Element | null => {
	const navigate = useNavigate();
	const randomizeOnBlank = edumeetConfig.randomizeOnBlank;
	const [ roomId, setRoomId ] = useState(randomizeOnBlank ? randomString({ length: 8 }).toLowerCase() : '');
	const [ rooms, setRooms ] = useState<Array<{ id: number; name: string }>>([]);
	const [ activeEntryTab, setActiveEntryTab ] = useState(0);
	
	const onClicked = () => navigate(`/${roomId}`);

	const privacyUrl = edumeetConfig.privacyUrl ?? '';
	const imprintUrl = edumeetConfig.imprintUrl ?? '';
	const qrCodeEnabled = edumeetConfig.qrCodeEnabled;
	const roomDropdownEnabled = edumeetConfig.roomDropdownEnabled;

	const dispatch = useAppDispatch();
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);

	useEffect(() => {
		if (!roomDropdownEnabled) return;

		if (loggedIn && rooms.length > 0) {
			setActiveEntryTab(1);
		}

		if (!loggedIn) {
			setActiveEntryTab(0);
		}
	}, [ roomDropdownEnabled, loggedIn, rooms ]);

	useEffect(() => {
		dispatch(startListeners());

		return () => {
			dispatch(stopListeners());
		};
	}, [ dispatch ]);

	useEffect(() => {
		if (!roomDropdownEnabled || !loggedIn) return;

		dispatch(getData('rooms')).then((roomsData) => {
			if (roomsData && roomsData.data) {
				setRooms(roomsData.data);
			}
		});
	}, [ roomDropdownEnabled, loggedIn ]);

	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);

	const handleRoomSelect = (event: React.ChangeEvent<{ value: unknown }>) => {
		const selectedValue = event.target.value as string;

		setRoomId(selectedValue);
	};

	const handleDropdownOpen = () => {
		dispatch(getData('rooms')).then((roomsData) => {
			if (roomsData && roomsData.data) {
				setRooms(roomsData.data);
			}
		});
	};

	useEffect(() => {
		if (!roomDropdownEnabled || !loggedIn) return;

		const handleVisibilityChange = () => {
			if (!document.hidden) {
				dispatch(getData('rooms')).then((roomsData) => {
					if (roomsData && roomsData.data) {
						setRooms(roomsData.data);
					}
				});
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [ roomDropdownEnabled, loggedIn, dispatch ]);

	if (localeInProgress) {
		return null;
	}

	return (
		<StyledBackground>
			<GenericDialog
				showFooter={true}
				precallTitleBackground={true}
				title={ <PrecallTitle /> }
				content={
					<Container style={{ textAlign: 'center' }}>
						{qrCodeEnabled && <QRCode value={`${window.location.protocol}//${window.location.hostname }/${roomId}`} />}
						<Tabs
							value={activeEntryTab}
							onChange={(_event, value) => {
								setActiveEntryTab(value);
							}}
							centered
						>
							<Tab label="Enter room name" aria-label="Enter room name" />
							{roomDropdownEnabled && loggedIn && rooms.length > 0 && (
								<Tab label="Select from my rooms" aria-label="Select from my rooms" />
							)}
						</Tabs>
						{activeEntryTab === 0 && (
							<TextInputField
								label={roomNameLabel()}
								value={roomId}
								setValue={setRoomId}
								onEnter={onClicked}
								randomizeOnBlank={randomizeOnBlank}
								autoFocus
							/>
						)}
						{activeEntryTab === 1 && roomDropdownEnabled && loggedIn && rooms.length > 0 && (
							<FormControl fullWidth margin="normal">
								<InputLabel id="room-select-label">{roomNameLabel()}</InputLabel>
								<Select
									labelId="room-select-label"
									id="room-select"
									value={roomId}
									label={roomNameLabel()}
									onChange={handleRoomSelect}
									onOpen={handleDropdownOpen}
									autoFocus
								>
									{rooms.map((room) => (
										<MenuItem key={room.id} value={room.name}>{room.name}</MenuItem>
									))}
								</Select>
							</FormControl>
						)}
					</Container>
				}
				actions={
					<Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
						<Box display="flex" alignItems="left">
							{imprintUrl.trim() !== '' && (
								<Link href={imprintUrl} target="_blank" color="inherit" underline="none">
									<Typography variant="body2">{ imprintLabel() }</Typography>
								</Link>
							)}
							{privacyUrl.trim() !== '' && (
								<Link href={privacyUrl} target="_blank" color="inherit" underline="none" style={{ marginLeft: '16px' }}>
									<Typography variant="body2">{ privacyLabel() }</Typography>
								</Link>
							)}
						</Box>
						<Button
							onClick={onClicked}
							variant='contained'
							disabled={!roomId}
							size='small'
						>
							{ joinLabel()}
						</Button>
					</Box>
				}
			/>
			
		</StyledBackground>
	);
};

export default LandingPage;

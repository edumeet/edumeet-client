import { SyntheticEvent, useEffect, useMemo, useState } from 'react';
// eslint-disable-next-line camelcase
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Autocomplete
} from '@mui/material';
import React from 'react';
import { GroupRoles, Roles, Room, RoomOwners, Tenant, User } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createRoomWithParams, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import RoomOwnerTable from './RoomOwner';
import RoomUserRoleTable from './roomUserRole';
import {
  addNewLabel,
  applyLabel,
  breakoutsEnabledLabel,
  cancelLabel,
  chatEnabledLabel,
  defaultRoleLabel,
  deleteLabel,
  descLabel,
  filesharingEnabledLabel,
  genericItemDescLabel,
  groupRolesLabel,
  localRecordingEnabledLabel,
  lockRoomLabel,
  logoLabel,
  manageItemLabel,
  maxActiveVideosLabel,
  nameLabel,
  noLabel,
  ownersLabel,
  raiseHandEnabledLabel,
  reactionsEnabledLabel,
  roomBgLabel,
  roomLockedLabel,
  tenantLabel,
  undefinedLabel,
  yesLabel
} from '../../translated/translatedComponents';

const RoomTable = () => {
  const dispatch = useAppDispatch();

  const [tenants, setTenants] = useState<Tenant[]>([{ id: 0, name: '', description: '' }]);
  const [roles, setRoles] = useState<Roles[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [data, setData] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [id, setId] = useState(0);
  const [name, setName] = useState('');
  const [nameDisabled, setNameDisabled] = useState(false);
  const [description, setDescription] = useState('');
  const [tenantId, setTenantId] = useState(0);
  const [defaultRoleId, setDefaultRoleId] = useState(0);

  const [tenantIdOption, setTenantIdOption] = useState<Tenant | undefined>();
  const [defaultRoleIdOption, setDefaultRoleIdOption] = useState<Roles | undefined>();

  const [logo, setLogo] = useState('');
  const [background, setBackground] = useState('');
  const [maxActiveVideos, setMaxActiveVideos] = useState(0);

  const [locked, setLocked] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [raiseHandEnabled, setRaiseHandEnabled] = useState(false);
  const [reactionsEnabled, setReactionsEnabled] = useState(false);
  const [filesharingEnabled, setFilesharingEnabled] = useState(false);
  const [localRecordingEnabled, setLocalRecordingEnabled] = useState(false);
  const [breakoutsEnabled, setBreakoutsEnabled] = useState(false);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      dispatch(getData('users')),
      dispatch(getData('tenants')),
      dispatch(getData('roles')),
      dispatch(getData('rooms')),
    ]).then(([u, t, r, rooms]: any) => {
      if (u) setUsers(u.data);
      if (t) setTenants(t.data);
      if (r) setRoles(r.data);
      if (rooms) setData(rooms.data);
      setIsLoading(false);
    });
  }, []);

  const handleClickOpen = () => {
    setId(0);
    setName('');
    setDescription('');
    setNameDisabled(false);

    if (tenants.length === 1) {
      setTenantId(tenants[0].id);
      setTenantIdOption(tenants[0]);
    } else {
      setTenantId(0);
      setTenantIdOption(undefined);
    }

    setDefaultRoleId(0);
    setDefaultRoleIdOption(undefined);
    setOpen(true);
  };

  return (
    <>
      <Button variant="outlined" onClick={handleClickOpen}>
        {addNewLabel()}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{manageItemLabel()}</DialogTitle>
        <DialogContent>
          <DialogContentText>{genericItemDescLabel()}</DialogContentText>

          {/* ✅ TENANT DROPDOWN ONLY WHEN MORE THAN ONE TENANT */}
          {tenants.length > 1 && (
            <Autocomplete
              options={tenants}
              getOptionLabel={(option) => option.name}
              fullWidth
              disableClearable
              value={tenantIdOption || null}
              onChange={(_, v) => v && (setTenantId(v.id), setTenantIdOption(v))}
              renderInput={(params) => <TextField {...params} label={tenantLabel()} />}
              sx={{ mt: 1 }}
            />
          )}

          <TextField
            fullWidth
            margin="dense"
            label={nameLabel()}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={nameDisabled}
          />

          <TextField
            fullWidth
            margin="dense"
            label={descLabel()}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Autocomplete
            options={roles}
            getOptionLabel={(o) => o.name}
            fullWidth
            disableClearable
            value={defaultRoleIdOption || null}
            onChange={(_, v) => v && (setDefaultRoleId(v.id), setDefaultRoleIdOption(v))}
            renderInput={(params) => <TextField {...params} label={defaultRoleLabel()} />}
            sx={{ mt: 1 }}
          />

          <FormControlLabel control={<Checkbox checked={locked} onChange={(e) => setLocked(e.target.checked)} />} label={lockRoomLabel()} />
          <FormControlLabel control={<Checkbox checked={chatEnabled} onChange={(e) => setChatEnabled(e.target.checked)} />} label={chatEnabledLabel()} />
          <FormControlLabel control={<Checkbox checked={breakoutsEnabled} onChange={(e) => setBreakoutsEnabled(e.target.checked)} />} label={breakoutsEnabledLabel()} />

          {id !== 0 && (
            <>
              <RoomOwnerTable roomId={id} />
              <RoomUserRoleTable roomId={id} />
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>{cancelLabel()}</Button>
          <Button onClick={() => {}}>{applyLabel()}</Button>
        </DialogActions>
      </Dialog>

      <MaterialReactTable
        columns={useMemo<MRT_ColumnDef<Room>[]>(() => [], [])}
        data={data}
        state={{ isLoading }}
      />
    </>
  );
};

export default RoomTable;
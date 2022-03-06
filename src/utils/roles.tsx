/* eslint-disable no-unused-vars,no-shadow */
export interface Role {
	id: number;
	label: string;
	level: number;
	promotable: boolean;
}

export type Permission = string;

export const permissions: Record<string, string> = {
	// The role(s) have permission to lock/unlock a room
	CHANGE_ROOM_LOCK: 'CHANGE_ROOM_LOCK',
	// The role(s) have permission to promote a peer from the lobby
	PROMOTE_PEER: 'PROMOTE_PEER',
	// The role(s) have permission to give/remove other peers roles
	MODIFY_ROLE: 'MODIFY_ROLE',
	// The role(s) have permission to send chat messages
	SEND_CHAT: 'SEND_CHAT',
	// The role(s) have permission to moderate chat
	MODERATE_CHAT: 'MODERATE_CHAT',
	// The role(s) have permission to share audio
	SHARE_AUDIO: 'SHARE_AUDIO',
	// The role(s) have permission to share video
	SHARE_VIDEO: 'SHARE_VIDEO',
	// The role(s) have permission to share screen
	SHARE_SCREEN: 'SHARE_SCREEN',
	// The role(s) have permission to produce extra video
	EXTRA_VIDEO: 'EXTRA_VIDEO',
	// The role(s) have permission to share files
	SHARE_FILE: 'SHARE_FILE',
	// The role(s) have permission to moderate files
	MODERATE_FILES: 'MODERATE_FILES',
	// The role(s) have permission to moderate room (e.g. kick user)
	MODERATE_ROOM: 'MODERATE_ROOM',
	// The role(s) have permission to start room recording localy
	LOCAL_RECORD_ROOM: 'LOCAL_RECORD_ROOM'
};

/* export const Roles: Record<string, Role> = {
	ADMIN: { id: 2529, label: 'admin', level: 50, promotable: true },
	MODERATOR: { id: 5337, label: 'moderator', level: 40, promotable: true },
	PRESENTER: { id: 9583, label: 'presenter', level: 30, promotable: true },
	AUTHENTICATED: { id: 5714, label: 'authenticated', level: 20, promotable: false },
	NORMAL: { id: 4261, label: 'normal', level: 10, promotable: false },
}; */
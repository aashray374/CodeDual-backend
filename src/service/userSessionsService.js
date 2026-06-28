const connectedUsers = new Map();
const dualSessions = new Map();
const revDualSession = new Map();
const pendingInvitations = new Map();


export function addUser(
    userId,
    socketId
){
    connectedUsers.set(userId, socketId);
}

export function removeUser(
    userId
){
    connectedUsers.delete(userId);
}

export function getSocketId(
    userId
){
    return connectedUsers.get(userId);
}

export function isUserOnline(
    userId
){
    return connectedUsers.has(userId);
}


export function addMember(
    dualCode,
    userId
){
    if(dualSessions.get(dualCode) == null){
        dualSessions.set(dualCode, new Set());
    }

    dualSessions.get(dualCode).add(userId);
    revDualSession.set(userId, dualCode);
}

export function isCodeAvailable(
    code
){
    return dualSessions.get(code) == null;
}

export function isPlayerInDual(
    userId
){
    return revDualSession.has(userId);
}

export function doesDualExists(
    dualCode
){
    return dualSessions.has(dualCode);
}

export function getDualMembers(
    dualCode
){
    return dualSessions.get(dualCode) ?? new Set();
}

export function getDualCodeByUserId(
    userId
){
    return revDualSession.get(userId);
}

export function removeMember(
    userId
){
    const dualCode = revDualSession.get(userId);

    if(!dualCode) return;

    dualSessions.get(dualCode)?.delete(userId);

    if(dualSessions.get(dualCode)?.size === 0){
        dualSessions.delete(dualCode);
    }

    revDualSession.delete(userId);
}



export function addPendingInvitation(
    receiverId,
    senderId,
    rating
){
    pendingInvitations.set(receiverId, { senderId, rating });
}

export function getPendingInvitation(
    receiverId
){
    return pendingInvitations.get(receiverId) ?? null;
}

export function removePendingInvitation(
    receiverId
){
    pendingInvitations.delete(receiverId);
}
// sockets/socketEvents.js

import {
    addUser,
    removeUser,
    getSocketId,
    isUserOnline,
    getDualCodeByUserId,
    removeMember,
    addPendingInvitation,
    getPendingInvitation,
    removePendingInvitation
} from "../services/userSessionsService.js";

import {
    startDual,
    endDual,
    createDual,
    joinDual
} from "../service/dualService.js";

import {
    checkForACSubmission
} from "../service/codeforcesService.js";


export default function registerSocketEvents(
    io,
    socket
){

    const user = socket.user;

    addUser(
        user.id,
        socket.id
    );

    console.log(
        `${user.username} connected`
    );


    // ── Dual: Send Invitation ──────────────────────────────────────────
    // Sender picks a target player and a rating, server forwards the
    // invite to the receiver's socket.

    socket.on(
        "dual:invitation",
        ({ receiverId, rating }) => {

            const receiverSocket =
                getSocketId(receiverId);

            if(!receiverSocket){

                socket.emit(
                    "user-offline",
                    {
                        userId: receiverId
                    }
                );

                return;
            }

            addPendingInvitation(
                receiverId,
                user.id,
                rating
            );

            io.to(receiverSocket).emit(
                "dual:invitation",
                {
                    senderId: user.id,
                    senderUsername: user.username,
                    rating
                }
            );

        }
    );


    // ── Dual: Accept Invitation ────────────────────────────────────────
    // Receiver accepts; server creates the dual in DB, registers both
    // players in the in-memory session, then notifies both sides with
    // the invite_code so they can join the socket room.

    socket.on(
        "dual:accept-invitation",
        async () => {

            try {

                const invitation = getPendingInvitation(user.id);

                if(!invitation){

                    socket.emit(
                        "dual:error",
                        {
                            message: "No pending invitation found"
                        }
                    );

                    return;
                }

                const { senderId, rating } = invitation;

                const senderSocket = getSocketId(senderId);

                if(!senderSocket){

                    removePendingInvitation(user.id);

                    socket.emit(
                        "user-offline",
                        {
                            userId: senderId
                        }
                    );

                    return;
                }

                // Create the dual under the sender's identity, then
                // join it as the receiver so both are registered in
                // the in-memory session before we broadcast.
                const senderUser = io.sockets.sockets
                    .get(senderSocket)?.user;

                const dual = await createDual(
                    senderUser,
                    rating
                );

                await joinDual(
                    user,
                    dual.invite_code
                );

                removePendingInvitation(user.id);

                const payload = {
                    invite_code: dual.invite_code,
                    rating: dual.rating
                };

                socket.emit(
                    "dual:invitation-accepted",
                    payload
                );

                io.to(senderSocket).emit(
                    "dual:invitation-accepted",
                    payload
                );

            } catch (error) {

                socket.emit(
                    "dual:error",
                    {
                        message: error.message
                    }
                );

            }

        }
    );


    // ── Dual: Decline Invitation ───────────────────────────────────────
    // Receiver declines; sender is notified and the pending invite
    // is cleared.

    socket.on(
        "dual:decline-invitation",
        () => {

            const invitation = getPendingInvitation(user.id);

            if(!invitation){
                return;
            }

            const { senderId } = invitation;

            removePendingInvitation(user.id);

            const senderSocket = getSocketId(senderId);

            if(!senderSocket){
                return;
            }

            io.to(senderSocket).emit(
                "dual:invitation-declined",
                {
                    declinedBy: user.id,
                    declinedByUsername: user.username
                }
            );

        }
    );


    // ── Dual: Join Room ────────────────────────────────────────────────
    // Called by both players after receiving dual:invitation-accepted
    // so they enter the Socket.IO room tied to the invite code.

    socket.on(
        "dual:join-room",
        ({ invite_code }) => {

            socket.join(invite_code);

            io.to(invite_code).emit(
                "dual:player-joined",
                {
                    userId: user.id,
                    username: user.username
                }
            );

            console.log(
                `${user.username} joined room ${invite_code}`
            );

        }
    );


    // ── Dual: Start ────────────────────────────────────────────────────
    // Either player triggers this once both are in the room.
    // Picks a problem neither has solved and broadcasts it to the room.

    socket.on(
        "dual:start",
        async ({ invite_code }) => {

            try {

                const { dual, problem } = await startDual(
                    invite_code
                );

                io.to(invite_code).emit(
                    "dual:started",
                    {
                        dual,
                        problem
                    }
                );

            } catch (error) {

                socket.emit(
                    "dual:error",
                    {
                        message: error.message
                    }
                );

            }

        }
    );


    // ── Dual: Check Submission ─────────────────────────────────────────
    // A player emits this to claim they solved the problem.
    // The server verifies against the Codeforces API before declaring
    // a winner.

    socket.on(
        "dual:submit",
        async ({
            invite_code,
            contestId,
            problemIndex,
            afterEpochSeconds
        }) => {

            try {

                const submissionId = await checkForACSubmission(
                    user.username,
                    contestId,
                    problemIndex,
                    afterEpochSeconds
                );

                if(!submissionId){

                    socket.emit(
                        "dual:submit-rejected",
                        {
                            message: "No accepted submission found yet"
                        }
                    );

                    return;
                }

                await endDual(
                    invite_code,
                    user.id
                );

                io.to(invite_code).emit(
                    "dual:ended",
                    {
                        winnerId: user.id,
                        winnerUsername: user.username,
                        submissionId
                    }
                );

            } catch (error) {

                socket.emit(
                    "dual:error",
                    {
                        message: error.message
                    }
                );

            }

        }
    );


    // ── Dual: Forfeit ──────────────────────────────────────────────────
    // A player voluntarily concedes, awarding the win to the other.

    socket.on(
        "dual:forfeit",
        async ({ invite_code }) => {

            try {

                const members =
                    io.sockets.adapter.rooms.get(invite_code);

                let winnerId = null;

                if(members){
                    for(const socketId of members){
                        const s =
                            io.sockets.sockets.get(socketId);
                        if(s && s.user.id !== user.id){
                            winnerId = s.user.id;
                            break;
                        }
                    }
                }

                await endDual(
                    invite_code,
                    winnerId
                );

                io.to(invite_code).emit(
                    "dual:ended",
                    {
                        winnerId,
                        forfeitedBy: user.id,
                        forfeitedByUsername: user.username
                    }
                );

            } catch (error) {

                socket.emit(
                    "dual:error",
                    {
                        message: error.message
                    }
                );

            }

        }
    );


    // ── Disconnect ─────────────────────────────────────────────────────

    socket.on(
        "disconnect",
        async () => {

            const invite_code = getDualCodeByUserId(user.id);

            if(invite_code){

                io.to(invite_code).emit(
                    "dual:player-disconnected",
                    {
                        userId: user.id,
                        username: user.username
                    }
                );

            }

            // Clean up any invite this user sent that hasn't been
            // acted on yet — notify the receiver if still online.
            removePendingInvitation(user.id);

            removeMember(user.id);
            removeUser(user.id);

            console.log(
                `${user.username} disconnected`
            );

        }
    );

}
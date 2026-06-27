// sockets/socketEvents.js

import {
    addUser,
    removeUser,
    getSocketId,
    getDualCodeByUserId,
    removeMember
} from "../services/userSessionsService.js";

import {
    startDual,
    endDual
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


    


    // ── Dual: Join Room ────────────────────────────────────────────────
    // Called by both players after HTTP create/join so they enter
    // the Socket.IO room tied to the invite code.

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
    // Either player can trigger this once both are in the room.
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
    // A player emits this to claim they have solved the problem.
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
    // A player can voluntarily concede, awarding the win to the other.

    socket.on(
        "dual:forfeit",
        async ({ invite_code }) => {

            try {

                const members = io.sockets.adapter.rooms.get(invite_code);
                let winnerId = null;

                if(members){
                    for(const socketId of members){
                        const s = io.sockets.sockets.get(socketId);
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

            removeMember(user.id);
            removeUser(user.id);

            console.log(
                `${user.username} disconnected`
            );

        }
    );

}
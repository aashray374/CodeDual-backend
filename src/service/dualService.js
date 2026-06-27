import pool from "../config/db.js";
import AppError from "../utils/AppError.js";
import generateShortCode from "../utils/dualUtils.js";
import {
    addMember,
    doesDualExists,
    isCodeAvailable,
    isPlayerInDual,
    getDualMembers
} from "./userSessionsService.js";
import { getRandomUnsolvedProblem } from "./codeforcesService.js";


async function getUniqueInviteCode() {
    const code = generateShortCode();

    const result = await pool.query(
        `SELECT *
        FROM dual d
        WHERE d.invite_code = $1 AND d.status <> 'ended'`,
        [
            code
        ]
    );

    if(result.rowCount === 0 && isCodeAvailable(code)){
        return code;
    }

    return await getUniqueInviteCode();
}


export async function createDual(
    user,
    rating
) {

    if(isPlayerInDual(user.id)){
        throw new AppError("Player already in a dual",409);
    }

    const invite_code = await getUniqueInviteCode();

    const result = await pool.query(
        `INSERT INTO dual(rating, invite_code)
        VALUES($1, $2)
        RETURNING *`,
        [
            rating,
            invite_code
        ]
    );

    const dual = result.rows[0];

    await pool.query(
        `INSERT INTO dual_members(user_id, dual_id)
        VALUES($1, $2)`,
        [
            user.id,
            dual.id
        ]
    );

    addMember(invite_code, user.id);

    return dual;
}


export async function joinDual(
    user,
    invite_code
) {

    if(isPlayerInDual(user.id)){
        throw new AppError("Player already in a dual",409);
    }

    if(!doesDualExists(invite_code)){
        throw new AppError("Dual does not exist",404);
    }

    const result = await pool.query(
        `SELECT *
        FROM dual d
        WHERE d.invite_code = $1 AND d.status = 'not_started'`,
        [
            invite_code
        ]
    );

    if(result.rowCount === 0){
        throw new AppError("Dual is not available to join",409);
    }

    const dual = result.rows[0];

    await pool.query(
        `INSERT INTO dual_members(user_id, dual_id)
        VALUES($1, $2)`,
        [
            user.id,
            dual.id
        ]
    );

    addMember(invite_code, user.id);

    return dual;
}


export async function startDual(
    invite_code
) {

    if(!doesDualExists(invite_code)){
        throw new AppError("Dual does not exist",404);
    }

    const dualResult = await pool.query(
        `SELECT d.*, array_agg(u.rating) AS cf_ratings,
                array_agg(u.username) AS handles
        FROM dual d
        JOIN dual_members dm ON dm.dual_id = d.id
        JOIN users u ON u.id = dm.user_id
        WHERE d.invite_code = $1
        GROUP BY d.id`,
        [
            invite_code
        ]
    );

    if(dualResult.rowCount === 0){
        throw new AppError("Dual not found",404);
    }

    const dual = dualResult.rows[0];

    if(dual.status !== 'not_started'){
        throw new AppError("Dual has already started or ended",409);
    }

    const members = getDualMembers(invite_code);

    if(members.size < 2){
        throw new AppError("Need 2 players to start a dual",409);
    }

    const handles = dual.handles;

    const problem = await getRandomUnsolvedProblem(
        dual.rating,
        handles[0],
        handles[1]
    );

    const problemKey = `${problem.contestId}${problem.index}`;

    await pool.query(
        `UPDATE dual
        SET status = 'active',
            problem = $1
        WHERE invite_code = $2`,
        [
            problemKey,
            invite_code
        ]
    );

    return {
        dual: {
            ...dual,
            status: 'active',
            problem: problemKey
        },
        problem
    };
}


export async function endDual(
    invite_code,
    winnerId
) {

    if(!doesDualExists(invite_code)){
        throw new AppError("Dual does not exist",404);
    }

    const result = await pool.query(
        `UPDATE dual
        SET status = 'ended'
        WHERE invite_code = $1
        RETURNING *`,
        [
            invite_code
        ]
    );

    if(result.rowCount === 0){
        throw new AppError("Dual not found",404);
    }

    if(winnerId){
        const memberIds = [...getDualMembers(invite_code)];
        const loserId = memberIds.find(
            id => id !== winnerId
        );

        await pool.query(
            `UPDATE users SET wins = wins + 1 WHERE id = $1`,
            [winnerId]
        );

        if(loserId){
            await pool.query(
                `UPDATE users SET losses = losses + 1 WHERE id = $1`,
                [loserId]
            );
        }
    }

    return result.rows[0];
}


export async function getDualByInviteCode(
    invite_code
) {

    const result = await pool.query(
        `SELECT *
        FROM dual d
        WHERE d.invite_code = $1`,
        [
            invite_code
        ]
    );

    if(result.rowCount === 0){
        throw new AppError("Dual not found",404);
    }

    return result.rows[0];
}
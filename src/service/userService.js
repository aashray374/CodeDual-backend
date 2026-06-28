import pool from "../config/db.js";
import AppError from "../utils/AppError.js";
import { getUserInfo } from "./codeforcesService.js";


export async function getLeaderboardService(
    page,
    limit
){
    const offset = (page-1)*limit;

    const total = await pool.query(
        `SELECT COUNT(*)
        FROM users u
        WHERE u.wins+u.losses+u.draws > 0`
    );

    const users = await pool.query(
        `SELECT *
        FROM users u
        WHERE u.wins+u.losses+u.draws > 0
        ORDER BY u.elo DESC
        LIMIT $1
        OFFSET $2`,
        [
            limit,
            offset
        ]
    );

    return {
        page,
        limit,
        total: Number(
                total.rows[0].count
            ),
        data: users.rows
    };
}

export async function profileService(
    userId
){
    const result = await pool.query(
        `SELECT *
        FROM users u
        WHERE u.id = $1`,
        [
            userId
        ]
    );

    if(result.rowCount === 0){
        throw new AppError("User does not exists",404);
    }

    return result.rows[0];
}

export async function profileByUsernameService(
    username
) {
    const result = await pool.query(
        `SELECT *
        FROM users u
        WHERE u.username = $1`,
        [
            username
        ]
    );

    if(result.rowCount === 0){
        throw new AppError("User does not exists",404);
    }

    return result.rows[0];
}


export async function searchUsersByUsernameService(
    query,
    page,
    limit
){
    const offset = (page-1)*limit;

    const total = await pool.query(
        `SELECT COUNT(*)
        FROM users u
        WHERE u.username ILIKE $1`,
        [
            `%${query}%`
        ]
    );

    const users = await pool.query(
        `SELECT *
        FROM users u
        WHERE u.username ILIKE $1
        ORDER BY u.username ASC
        LIMIT $2
        OFFSET $3`,
        [
            `%${query}%`,
            limit,
            offset
        ]
    );

    return {
        page,
        limit,
        total: Number(
                total.rows[0].count
            ),
        data: users.rows
    };
}


export async function syncCFRatingService(
    user
){
    const CFInfo = await getUserInfo(user.codeforces_handle);

    if(CFInfo != null){
        const result = await pool.query(
            `UPDATE users
            SET codeforces_rating = $1,
                codeforces_rank = $2
            WHERE id = $3
            RETURNING *`,
            [
                CFInfo.rating,
                CFInfo.rank,
                user.id
            ]
        );

        return result.rows[0];
    }

    return user;
}
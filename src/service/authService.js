import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import AppError from "../utils/AppError.js";
import generateToken from "../utils/jwtUtils.js";

export async function signupService(
    username, 
    email, 
    password, 
    codeforcesHandle, 
    displayName
) {
    const isAvailable = await pool.query(
        `SELECT * 
        FROM users u 
        WHERE u.email = $1 OR u.username = $2`,
        [email, username]
    );

    if (isAvailable.rowCount == 0) {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users(username, email, password, codeforces_handle, display_name)
             VALUES($1, $2, $3, $4, $5) RETURNING *`,
            [username, email, hashedPassword, codeforcesHandle || null, displayName || username]
        );

        const user = result.rows[0];
        return {
            user: { id: user.id, email: user.email, username: user.username,
                    codeforcesHandle: user.codeforces_handle, displayName: user.display_name,
                    wins: user.wins, losses: user.losses, draws: user.draws,
                    elo: user.elo, duelRating: user.elo },
            token: generateToken(user.id, user.email, user.username)
        };
    } else {
        if (isAvailable.rows.find(r => r.username === username)) {
            throw new AppError("Username already taken", 409);
        }
        throw new AppError(`User with email ${email} already exists`, 409);
    }
}

export async function loginService(
    usernameOrEmail,
    password) {
    const user = await pool.query(
        `SELECT * FROM 
        users u 
        WHERE u.email = $1 OR u.username = $1`,
        [usernameOrEmail]
    );

    if (user.rowCount != 0) {
        if (await bcrypt.compare(password, user.rows[0].password)) {
            const u = user.rows[0];
            return {
                user: { id: u.id, email: u.email, username: u.username,
                        codeforcesHandle: u.codeforces_handle, displayName: u.display_name || u.username,
                        wins: u.wins, losses: u.losses, draws: u.draws,
                        elo: u.elo, duelRating: u.elo,
                        codeforcesRating: u.codeforces_rating, codeforcesRank: u.codeforces_rank,
                        totalDuels: (u.wins || 0) + (u.losses || 0) + (u.draws || 0) },
                token: generateToken(u.id, u.email, u.username)
            };
        }
        throw new AppError("Incorrect password", 401);
    }
    throw new AppError("User does not exist", 404);
}

import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export default async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "Token not found" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            `SELECT * FROM users WHERE id = $1`,
            [decoded.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        const u = result.rows[0];
        req.user = {
            id: u.id, username: u.username, email: u.email,
            displayName: u.display_name || u.username,
            codeforcesHandle: u.codeforces_handle,
            codeforcesRating: u.codeforces_rating,
            codeforcesRank: u.codeforces_rank,
            wins: u.wins || 0, losses: u.losses || 0, draws: u.draws || 0,
            elo: u.elo, duelRating: u.elo,
            totalDuels: (u.wins || 0) + (u.losses || 0) + (u.draws || 0),
            avatarUrl: u.avatar_url || null,
        };

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
}

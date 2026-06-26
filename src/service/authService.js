import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import AppError from "../utils/AppError.js";
import generateToken from "../utils/jwtUtils.js";


export async function signupService(
    username,
    email,
    password
) {
    
    const isAvailable = await pool.query(
        `SELECT *
        FROM users u 
        WHERE u.email = $1 OR u.username = $2`,
        [email,username]
    );
    
    
    if(isAvailable.rowCount == 0){
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );
        
        const result = await pool.query(
            `INSERT INTO users(username,email,password)
            values($1,$2,$3)
            RETURNING *`,
            [
                username,
                email,
                hashedPassword
            ]
        );

        return {
            user:{
                id:result.rows[0].id,
                email:result.rows[0].email,
                username:result.rows[0].username
            },
            token : generateToken(
                result.rows[0].id,
                result.rows[0].email,
                result.rows[0].username
            )
        };
    }else{
        if(isAvailable.rows.find(r=>r.username === username)){
            throw new AppError(
                "UserName Already Taken",
                404
            );
        }else{
            throw new AppError(
                `User with Email ${email} already exists`,
                409
            );
        }
    }
}

export async function loginService(
    email,
    password
) {
    const user = await pool.query(
        `SELECT *
        FROM users u 
        WHERE u.email = $1`,
        [email]
    );
    
    if(user.rowCount != 0){
        if(await bcrypt.compare(password,user.rows[0].password)){
            return {
                user:{
                    id:user.rows[0].id,
                    email:user.rows[0].email,
                    username:user.rows[0].username
                },
                token: generateToken(
                    user.rows[0].id,
                    user.rows[0].email,
                    user.rows[0].username
                )
            };
        }
        throw new AppError(
            "Incorrect Password",
            401
        );
    }else{
        throw new AppError(
            "User Does not exists",
            404
        );
    }
}
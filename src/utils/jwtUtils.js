import jwt from "jsonwebtoken";

export default function generateToken(
    id,
    email,
    username
){
    const token = jwt.sign(
        {
            user:{
                id: id,
                email: email,
                username: username
            }
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    )

    return token;
}
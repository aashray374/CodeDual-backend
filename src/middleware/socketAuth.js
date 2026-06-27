
import jwt from "jsonwebtoken";

export default function socketAuth(socket,next){

    try{

        const token =
            socket.handshake.auth.token;

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        socket.user = decoded.user;

        next();

    }catch(err){

        next(new Error("Unauthorized"));

    }

}
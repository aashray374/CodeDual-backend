import jwt from "jsonwebtoken";

export default function authMiddleware(
    req,
    res,
    next
){
    try {
        const authHeader = req.headers.authorization;
        console.log("Middleware hit");
        if(!authHeader){
            console.log(req);
            return res.status(401).json({
                message: "Token Not Found"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        console.log(decoded);
        req.user = decoded.user

        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            message: "Invalid Token"
        })
    }
}
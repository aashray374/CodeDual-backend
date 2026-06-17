import { loginService, signupService } from "../service/authService.js";

export async function loginController(
    req,
    res
) {
    try {
        const {email,password} = req.body;
        const user = await loginService(
            email,
            password
        );   

        res.status(200).json({
            user
        });

    } catch(error){

        res.status(
            error.statusCode || 500
        ).json({
            success:false,
            message:error.message
        });

    }
}

export async function signupController(
    req,
    res
){
    try {
        const {username,email,password} = req.body;
        const user = await signupService(
            username,
            email,
            password
        );
        
        res.status(200).json({
            user
        });

    } catch(error){

        res.status(
            error.statusCode || 500
        ).json({
            success:false,
            message:error.message
        });

    }

}
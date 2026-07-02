import { loginService, signupService } from "../service/authService.js";

export async function loginController(
    req,
    res
) {
    try {
        const { email, usernameOrEmail, password } = req.body;
        const result = await loginService(
            usernameOrEmail || email,
            password
        );

        res.status(200).json({
            success: true,
            data: {
                user: result.user,
                accessToken: result.token,
                refreshToken: result.token
            }
        });

    } catch (error) {

        res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });

    }
}

export async function signupController(
    req,
    res
) {
    try {
        const { username, email, password, codeforcesHandle, displayName  } = req.body;
        const user = await signupService(
            username,
            email,
            password,
            codeforcesHandle,
            displayName
        );

        res.status(200).json({
            success: true,
            data: {
                user: result.user,
                accessToken: result.token,
                refreshToken: result.token
            }
        });

    } catch (error) {

        res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });

    }

}


export async function meController(req, res) {
    try {
        res.status(200).json({
            success: true,
            data: req.user 
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message 
        });
    }
}

export async function logoutController(req, res) {
    res.status(200).json({ 
        success: true, 
        message: "Logged out" 
    });
}

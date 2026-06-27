import {
    createDual,
    joinDual,
    getDualByInviteCode
} from "../service/dualService.js";


export async function createDualController(
    req,
    res
) {

    try {

        const user = req.user;
        const { rating } = req.body;

        const dual = await createDual(
            user,
            rating
        );

        return res.status(201).json({
            success: true,
            message: "Dual created successfully",
            data: dual
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


export async function joinDualController(
    req,
    res
) {

    try {

        const user = req.user;
        const { invite_code } = req.params;

        const dual = await joinDual(
            user,
            invite_code
        );

        return res.status(200).json({
            success: true,
            message: "Joined dual successfully",
            data: dual
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


export async function getDualController(
    req,
    res
) {

    try {

        const { invite_code } = req.params;

        const dual = await getDualByInviteCode(
            invite_code
        );

        return res.status(200).json({
            success: true,
            data: dual
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
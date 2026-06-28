import {
    getLeaderboardService,
    profileService,
    profileByUsernameService,
    searchUsersByUsernameService,
    syncCFRatingService
} from "../service/userService.js";


export async function getLeaderboardController(
    req,
    res
) {

    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;

        const result = await getLeaderboardService(
            page,
            limit
        );

        return res.status(200).json(result);

    } catch (error) {

        res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });

    }
}


export async function profileController(
    req,
    res
) {

    try {

        const userId = req.params.userId;
        const result = await profileService(
            userId
        );

        return res.status(200).json(result);

    } catch (error) {

        res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });

    }
}


export async function profileByUsernameController(
    req,
    res
) {

    try {

        const username = req.params.username;
        const result = await profileByUsernameService(
            username
        );

        return res.status(200).json(result);

    } catch (error) {

        res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });

    }
}


export async function searchUsersController(
    req,
    res
) {

    try {

        const query = req.query.username || "";
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        const result = await searchUsersByUsernameService(
            query,
            page,
            limit
        );

        return res.status(200).json(result);

    } catch (error) {

        res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message
        });

    }
}


export async function syncCFRatingController(
    req,
    res
){

    try {

        const user = req.user;
        const result = await syncCFRatingService(
            user
        );

        return res.status(200).json({
            success: true,
            message: "Codeforces rating synced!",
            user: result
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
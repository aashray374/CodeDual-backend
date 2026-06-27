import { getProblemsByRating, getUserInfo } from "../service/codeforcesService.js";

const VALID_RATINGS = [
    800, 900, 1000, 1100, 1200, 1300, 1400, 1500,
    1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300,
    2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100,
    3200, 3300, 3400, 3500
];


export async function getProblemsByRatingController(
    req,
    res
) {

    try {

        const rating = Number(req.query.rating);
        const problems = await getProblemsByRating(
            rating
        );

        return res.status(200).json({
            success: true,
            message: `Found ${problems.length} problems at rating ${rating}`,
            data: problems
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


export async function getValidRatingsController(
    req,
    res
) {

    try {

        return res.status(200).json({
            success: true,
            data: VALID_RATINGS
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


export async function verifyHandleController(
    req,
    res
) {

    try {

        const handle = req.params.handle;
        const info = await getUserInfo(
            handle
        );

        if(info == null){
            return res.status(200).json({
                success: false,
                message: `Codeforces handle '${handle}' not found`
            });
        }

        return res.status(200).json({
            success: true,
            message: "Handle verified",
            data: info
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
import axios from "axios";
import AppError from "../utils/AppError.js";

const CF_BASE_URL = process.env.CODEFORCES_API_BASE_URL;

function toProblemResponse(problem) {
    return {
        contestId: problem.contestId,
        index: problem.index,
        name: problem.name,
        rating: problem.rating,
        tags: problem.tags || [],
    };
}


export async function getSolvedProblems(handle) {
    try {
        const { data } = await axios.get(
            `${CF_BASE_URL}/user.status`,
            {
                params: {
                    handle,
                    from: 1,
                    count: 10000,
                },
            }
        );

        if (!data || data.status !== "OK") {
            console.warn(
                `Could not fetch submissions for handle: ${handle}`
            );
            return new Set();
        }

        return new Set(
            data.result
                .filter(submission => submission.verdict === "OK")
                .map(submission => {
                    const problem = submission.problem;

                    return problem
                        ? `${problem.contestId}-${problem.index}`
                        : null;
                })
                .filter(Boolean)
        );
    } catch (error) {
        console.error(
            `Error fetching submissions for ${handle}:`,
            error.message
        );
        return new Set();
    }
}



export async function getProblemsByRating(rating) {
    try {
        const { data } = await axios.get(
            `${CF_BASE_URL}/problemset.problems`
        );

        if (!data || data.status !== "OK") {
            console.error("Failed to fetch problems from Codeforces");
            return [];
        }

        return data.result.problems
            .filter(
                problem =>
                    problem.rating === rating &&
                    problem.contestId != null &&
                    problem.index != null
            )
            .map(toProblemResponse);
    } catch (error) {
        console.error("Error calling Codeforces API:", error.message);
        return [];
    }
}




export async function getRandomUnsolvedProblem(
    rating,
    handle1,
    handle2
) {
    const allProblems = await getProblemsByRating(rating);

    if (!allProblems.length) {
        throw new Error(`No problems found for rating ${rating}`);
    }

    const solved1 = await getSolvedProblems(handle1);
    const solved2 = await getSolvedProblems(handle2);

    let unsolved = allProblems.filter(problem => {
        const key = `${problem.contestId}-${problem.index}`;
        return !solved1.has(key) && !solved2.has(key);
    });

    if (!unsolved.length) {
        console.warn(
            `No unsolved problems found for rating ${rating}. Using any problem.`
        );
        unsolved = allProblems;
    }

    const randomIndex = Math.floor(Math.random() * unsolved.length);
    return unsolved[randomIndex];
}


export async function checkForACSubmission(
    handle,
    contestId,
    problemIndex,
    afterEpochSeconds
) {
    try {
        const { data } = await axios.get(
            `${CF_BASE_URL}/user.status`,
            {
                params: {
                    handle,
                    from: 1,
                    count: 50,
                },
            }
        );

        if (!data || data.status !== "OK") {
            return null;
        }

        const submission = data.result.find(submission => {
            const problem = submission.problem;

            return (
                submission.verdict === "OK" &&
                problem &&
                problem.contestId === contestId &&
                problem.index === problemIndex &&
                submission.creationTimeSeconds >= afterEpochSeconds
            );
        });

        return submission ? submission.id : null;
    } catch (error) {
        console.error(
            `Error checking AC submission for ${handle}:`,
            error.message
        );
        return null;
    }
}



export async function getUserInfo(handle) {
    try {
        const { data } = await axios.get(
            `${CF_BASE_URL}/user.info`,
            {
                params: {
                    handles: handle,
                },
            }
        );

        if (
            data &&
            data.status === "OK" &&
            data.result?.length
        ) {
            return data.result[0];
        }

        return null;
    } catch (error) {
        console.error(
            `Error fetching user info for ${handle}:`,
            error.message
        );
        return null;
    }
}

export async function doesHandleExist(handle) {
    return (await getUserInfo(handle)) !== null;
}
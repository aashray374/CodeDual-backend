import express from "express";
import {
    getLeaderboardController,
    profileByUsernameController,
    profileController,
    searchUsersController,
    syncCFRatingController
} from "../controller/userController.js";

const router = express.Router();


router.get("/leaderboard", getLeaderboardController);
router.get("/search", searchUsersController);
router.get("/by-username/:username", profileByUsernameController);
router.get("/:userId/profile", profileController);
router.post("/sync-cf-rating", syncCFRatingController);

export default router;
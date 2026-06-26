import express from "express";
import { getLeaderboardController, profileByUsernameController, profileController, syncCFRatingController } from "../controller/userController.js";

const router = express.Router();


router.get("/leaderboard", getLeaderboardController);
router.get("/:userId/profile", profileController);
router.get("/by-username/:username", profileByUsernameController);
router.post("/sync-cf-rating", syncCFRatingController);

export default router;
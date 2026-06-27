import express from "express";
import { getProblemsByRatingController, getValidRatingsController, verifyHandleController } from "../controller/problemsController.js";

const router = express.Router();


router.get("/", getProblemsByRatingController);
router.get("/ratings", getValidRatingsController);
router.get("/verify-handle/:handle", verifyHandleController);

export default router;
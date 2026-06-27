import express from "express";
import {
    createDualController,
    joinDualController,
    getDualController
} from "../controller/dualController.js";

const router = express.Router();


router.post("/", createDualController);
router.post("/join/:invite_code", joinDualController);
router.get("/:invite_code", getDualController);

export default router;
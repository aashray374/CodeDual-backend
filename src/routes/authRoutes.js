import express from "express";
import { loginController, signupController } from "../controller/authController.js";

const router = express.Router();

router.post("/auth/login",loginController);
router.post("/auth/signup",signupController);

export default router;
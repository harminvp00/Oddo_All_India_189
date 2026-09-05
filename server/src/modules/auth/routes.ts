import { Router } from "express";
import {
  handleLogin,
  handleGoogleAuth,
  handleGoogleLogin,
  handleGoogleCallback,
  handleMe,
} from "./controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

router.post("/login", handleLogin);
router.post("/google", handleGoogleAuth);
router.get("/google/login", handleGoogleLogin);
router.get("/google/callback", handleGoogleCallback);
router.get("/me", authenticateToken, handleMe);

export default router;

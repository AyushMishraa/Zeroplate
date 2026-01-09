import express from "express";
import passport from "../services/authService";
import { generateToken } from "../utils/generateToken";
import { signup, login } from "../controllers/authController";
import { authLimiter } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);

router.get("/google", passport.authenticate("google", {scope: ["profile", "email"]}));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    console.log("req.user", req.user);
    // @ts-ignore
    const token = generateToken(req.user.email, req.user.role, req.user._id);
    res.json({ success: true, token: token, message: "Google authentication successful" });
  }
);

export default router;
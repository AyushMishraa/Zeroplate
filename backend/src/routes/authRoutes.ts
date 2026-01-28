import express, { Request, Response } from "express";
import passport from "../services/authService";
import { generateToken } from "../utils/generateToken";
import { signup, login, updateUserRole } from "../controllers/authController";
import { authLimiter } from "../middlewares/authMiddleware";
import { IUser } from "../models/userModel";

interface User extends IUser {}

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.put("/update-role", updateUserRole);

router.get("/google", passport.authenticate("google", {scope: ["profile", "email"]}));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req: Request, res: Response) => {
    console.log("req.user", req.user);
    const user = req.user as User;
    
    // Use the isNewUser flag set during passport authentication
    const isNewUser = user.isNewUser || false;
    
    const token = generateToken(user.email, user.role, user?._id?.toString());
    // Set token in httpOnly cookie
    res.cookie("token", token, {httpOnly: true, secure: true, sameSite: "strict"});
    // Redirect to frontend callback route with user info
    const userInfo = encodeURIComponent(JSON.stringify({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      provider: user.provider,
      isNewUser: isNewUser
    }));
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback?user=${userInfo}`);
  }
);

export default router;
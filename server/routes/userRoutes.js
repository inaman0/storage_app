import express from "express";
import checkAuth from "../middlewares/auth.js";
import {
  getCurrentUser,
  login,
  logout,
  logoutAll,
  register,
  loginVerifyOtp,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/", checkAuth, getCurrentUser);
router.post("/login-verify-otp", loginVerifyOtp);
router.post("/logout", logout);
router.post("/logout-all", logoutAll);

export default router;

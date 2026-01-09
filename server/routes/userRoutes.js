import express from "express";
import checkAuth from "../middlewares/auth.js";

import { createUser, userLogin } from "../controllers/userController.js";

const router = express.Router();

router.post('/register', createUser)

router.post('/login', userLogin)

router.get('/', checkAuth, (req, res) => {
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
  })
})

router.post('/logout', (req, res) => {
  res.clearCookie('uid')
  res.status(204).end()
})

export default router

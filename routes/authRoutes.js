// server/routes/authRoutes.js

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// ✅ 회원가입
router.post("/signup", async (req, res) => {
  const { userId, password, nickname } = req.body;

  const existing = await User.findOne({ userId });
  if (existing)
    return res.status(400).json({ message: "이미 가입된 아이디입니다." });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    userId,
    password: hashed,
    nickname,
    purchasedBooks: [],
    role: "user", // 기본 역할 명시적으로 지정
  });

  res.json({ message: "회원가입 완료" });
});

// ✅ 로그인
router.post("/login", async (req, res) => {
  const { userId, password } = req.body;
  const user = await User.findOne({ userId });

  if (!user) return res.status(401).json({ message: "아이디 없음" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "비밀번호 불일치" });

  // ✅ JWT에 role 포함
  const token = jwt.sign(
    {
      id: user._id,
      userId: user.userId,
      role: user.role, // ⬅ role 포함
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({
    token,
    user: {
      id: user._id,
      userId: user.userId,
      nickname: user.nickname,
      role: user.role, // ⬅ 클라이언트에서도 role 사용
    },
  });
});

export default router;

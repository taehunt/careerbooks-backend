import express from "express";
import jwt from "jsonwebtoken";
import PurchaseRequest from "../models/PurchaseRequest.js";
import { sendDiscordWebhook } from "../utils/discord.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { depositor, email, slug, memo } = req.body;

  if (!depositor || !email || !slug) {
    return res.status(400).json({ message: "필수 항목이 누락되었습니다." });
  }

  // 👤 사용자 정보 추출 (optional)
  let userInfoText = "";
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userInfoText = `\n🧑 사용자 ID: ${decoded.userId}\n🏷 닉네임: ${decoded.nickname}`;
    } catch (err) {
      console.warn("⚠️ 유저 토큰 디코딩 실패 (무시됨):", err.message);
    }
  }

  try {
    await PurchaseRequest.create({ depositor, email, slug, memo });

    await sendDiscordWebhook({
      depositor,
      email,
      slug,
      memo,
      userInfoText,
    });

    res.status(201).json({ message: "입금 정보가 제출되었습니다." });
  } catch (err) {
    console.error("입금 신청 저장 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;

import express from "express";
import PurchaseRequest from "../models/PurchaseRequest.js";
import { sendDiscordWebhook } from "../utils/discord.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { depositor, email, slug, memo } = req.body;

  if (!depositor || !email || !slug) {
    return res.status(400).json({ message: "필수 항목이 누락되었습니다." });
  }

  try {
    const request = await PurchaseRequest.create({ depositor, email, slug, memo });

    let userInfoText = "";
    if (req.user) {
      userInfoText = `\n🆔 사용자 ID: ${req.user.userId}\n👤 닉네임: ${req.user.nickname}`;
    }

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

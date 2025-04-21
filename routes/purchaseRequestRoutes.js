// 파일 위치: server/routes/purchaseRequestRoutes.js
import express from "express";
import PurchaseRequest from "../models/PurchaseRequest.js";
import { sendDiscordWebhook } from "../utils/discord.js"; // 선택사항

const router = express.Router();

router.post("/", async (req, res) => {
  const { depositor, email, slug, memo } = req.body;

  if (!depositor || !email || !slug) {
    return res.status(400).json({ message: "필수 항목이 누락되었습니다." });
  }

  try {
    const request = await PurchaseRequest.create({ depositor, email, slug, memo });

    // 선택: Discord 알림
    if (process.env.DISCORD_WEBHOOK_URL) {
      await sendDiscordWebhook({
        content: `💸 입금 신청 접수됨\n\n입금자: ${depositor}\n이메일: ${email}\n전자책: ${slug}\n메모: ${memo || "(없음)"}`,
      });
    }

    res.status(201).json({ message: "입금 정보가 제출되었습니다." });
  } catch (err) {
    console.error("입금 신청 저장 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;

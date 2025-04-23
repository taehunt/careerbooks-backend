import express from "express";
import Book from "../models/Book.js";
import { sendEbookEmail } from "../utils/mailer.js";

const router = express.Router();

// ✅ 모든 요청 로그 찍기
router.use((req, res, next) => {
  console.log("📩 emailRoutes 요청:", req.method, req.originalUrl);
  next();
});

router.post("/send-bulk", async (req, res) => {
  console.log("✅ send-bulk 진입");
  console.log("📦 payload:", req.body);

  const list = req.body;
  if (!Array.isArray(list)) {
    return res.status(400).json({ message: "잘못된 형식" });
  }

  try {
    for (const { slug, to } of list) {
      const book = await Book.findOne({ slug });
      if (!book || !book.fileName) continue;

      await sendEbookEmail({
        to,
        subject: `[CareerBooks] ${book.title} 전자책 첨부드립니다.`,
        text: `요청하신 "${book.title}" 전자책을 보내드립니다. 감사합니다.`,
        attachmentUrl: `https://pub-bb775a03143c476396cd5c6200cab293.r2.dev/${book.fileName}`,
        fileName: book.fileName,
      });
    }

    res.json({ message: "모든 메일 발송 완료" });
  } catch (err) {
    console.error("❌ 내부 오류:", err);
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

export default router;

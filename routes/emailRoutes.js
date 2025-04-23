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

  try {
    for (const { slug, to } of req.body) {
      const book = await Book.findOne({ slug });
      if (!book) {
        console.log("❌ book not found for slug:", slug);
        continue;
      }

      const url = book.fileName.startsWith("http")
        ? book.fileName
        : `https://pub-bb775a03143c476396cd5c6200cab293.r2.dev/${book.fileName}`;

      await sendEbookEmail({
        to,
        subject: `[CareerBooks] "${book.title}" 전자책 첨부드립니다.`,
        attachmentUrl: url,
        fileName: book.fileName,
        bookTitle: book.title,
      });
    }

    res.json({ message: "발송 완료" });
  } catch (err) {
    console.error("❌ 내부 오류:", err);
    res.status(500).json({ message: "이메일 발송 실패" });
  }
});

export default router;

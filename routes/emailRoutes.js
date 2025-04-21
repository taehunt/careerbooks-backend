// 파일 위치: root/server/routes/emailRoutes.js
import express from "express";
import { sendEbookEmail } from "../utils/mailer.js";
import Book from "../models/Book.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/send", async (req, res) => {
  const { userId, slug, to } = req.body;

  try {
    const book = await Book.findOne({ slug });
    if (!book || !book.fileName) {
      return res.status(400).json({ message: "파일 정보가 없습니다." });
    }

    const fileName = book.fileName;
    const url = `https://pub-bb775a03143c476396cd5c6200cab293.r2.dev/${fileName}`;

    await sendEbookEmail({
      to,
      subject: `[CareerBooks] "${book.title}" 전자책 첨부드립니다.`,
      text: `"${book.title}" 전자책을 첨부파일로 보내드립니다.\n감사합니다.`,
      attachmentUrl: url,
      fileName,
    });

    res.json({ message: "이메일 전송 완료" });
  } catch (err) {
    console.error("이메일 전송 실패", err);
    res.status(500).json({ message: "이메일 전송 중 오류 발생" });
  }
});

export default router;

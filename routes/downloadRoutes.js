// 파일 경로: root/server/routes/downloadRoutes.js

import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import axios from "axios";

const router = express.Router();

// ✅ 무료 전자책: 서버에서 프록시로 가져와 브라우저에 스트림 전송 (CORS 문제 해결)
router.get("/frontend00", async (req, res) => {
  try {
    const zipUrl = "https://pub-bb775a03143c476396cd5c6200cab293.r2.dev/frontend00.zip";
    const response = await axios.get(zipUrl, { responseType: "stream" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="frontend00.zip"',
    });

    response.data.pipe(res);
  } catch (err) {
    console.error("무료 전자책 프록시 다운로드 오류:", err);
    res.status(500).send("무료 전자책 다운로드 실패");
  }
});

// ✅ 유료 전자책 다운로드 (인증 + 구매 확인 + 유효기간 1년 확인)
router.get("/:slug", verifyToken, async (req, res) => {
  const { slug } = req.params;

  try {
    const user = await User.findById(req.user.id);
    const book = await Book.findOne({ slug });

    if (!book) return res.status(404).send("책을 찾을 수 없습니다.");

    const record = user.purchasedBooks.find((pb) =>
      typeof pb === "string" ? pb === slug : pb.slug === slug
    );
    if (!record) return res.status(403).send("구매하지 않은 책입니다.");

    const purchasedAt = typeof record === "string" ? null : new Date(record.purchasedAt);
    if (purchasedAt) {
      const expired = new Date(purchasedAt);
      expired.setFullYear(expired.getFullYear() + 1);
      if (new Date() > expired) {
        return res.status(403).send("다운로드 기간이 만료되었습니다.");
      }
    }

    const zipUrl = book.fileName;
    if (!zipUrl || !zipUrl.startsWith("https://")) {
      return res.status(400).send("유효한 ZIP URL이 없습니다.");
    }

    // 프록시 다운로드
    const response = await axios.get(zipUrl, { responseType: "stream" });
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}.zip"`,
    });
    response.data.pipe(res);
  } catch (err) {
    console.error("파일 다운로드 오류:", err);
    res.status(500).send("다운로드 실패");
  }
});

export default router;

import express from "express";
import axios from "axios";
import { verifyToken } from "../middleware/auth.js";
import Book from "../models/Book.js";
import User from "../models/User.js";

const router = express.Router();

// — 무료 전자책 /api/downloads/frontend00 —
// (프록시 스트림으로 전달, CORS 회피)
router.get("/frontend00", async (req, res) => {
  try {
    const zipUrl = "https://pub-bb775a03143c476396cd5c6200cab293.r2.dev/frontend00.zip";
    const upstream = await axios.get(zipUrl, { responseType: "stream" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="frontend00.zip"',
      "Access-Control-Allow-Origin": "*",
    });
    upstream.data.pipe(res);
  } catch (err) {
    console.error("무료 전자책 다운로드 오류:", err);
    res.status(500).send("무료 전자책 다운로드 실패");
  }
});

// — 유료 전자책 /api/downloads/:slug —
// (인증·구매검증·유효기간검증 후 프록시 스트림)
router.get("/:slug", verifyToken, async (req, res) => {
  const { slug } = req.params;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).send("사용자 없음");

    const record = user.purchasedBooks.find(pb =>
      typeof pb === "string" ? pb === slug : pb.slug === slug
    );
    if (!record) return res.status(403).send("구매하지 않은 책");

    const purchasedAt = typeof record === "string" ? null : new Date(record.purchasedAt);
    if (purchasedAt) {
      const expiry = new Date(purchasedAt);
      expiry.setFullYear(expiry.getFullYear() + 1);
      if (new Date() > expiry) return res.status(403).send("다운로드 기간 만료");
    }

    const book = await Book.findOne({ slug });
    if (!book || !book.fileName.startsWith("http")) {
      return res.status(400).send("유효한 ZIP URL 없음");
    }

    const upstream = await axios.get(book.fileName, { responseType: "stream" });
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}.zip"`,
      "Access-Control-Allow-Origin": "*",
    });
    upstream.data.pipe(res);
  } catch (err) {
    console.error("유료 전자책 다운로드 오류:", err);
    res.status(500).send("다운로드 실패");
  }
});

export default router;
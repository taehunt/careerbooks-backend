// root/server/routes/downloadRoutes.js

import express from "express";
import https from "https";
import { verifyToken } from "../middleware/auth.js";
import Book from "../models/Book.js";
import User from "../models/User.js";

const router = express.Router();

// ✅ 무료 전자책 프록시 다운로드
router.get("/frontend00", (req, res) => {
  const zipUrl = "https://pub-bb775a03143c476396cd5c6200cab293.r2.dev/frontend00.zip";
  https
    .get(zipUrl, (upstream) => {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="frontend00.zip"');
      res.setHeader("Access-Control-Allow-Origin", "*");
      upstream.pipe(res);
    })
    .on("error", (err) => {
      console.error("무료 전자책 다운로드 오류:", err);
      res.status(500).send("무료 전자책 다운로드 실패");
    });
});

// ✅ 유료 전자책 프록시 다운로드 (인증 · 구매 · 유효기간 검증 후)
router.get("/:slug", verifyToken, async (req, res) => {
  const { slug } = req.params;
  try {
    // 사용자 확인
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).send("사용자 없음");

    // 구매 기록 확인
    const record = user.purchasedBooks.find(pb =>
      typeof pb === "string" ? pb === slug : pb.slug === slug
    );
    if (!record) return res.status(403).send("구매하지 않은 책");

    // 유효기간(1년) 검사
    const purchasedAt = typeof record === "string"
      ? null
      : new Date(record.purchasedAt);
    if (purchasedAt) {
      const expiry = new Date(purchasedAt);
      expiry.setFullYear(expiry.getFullYear() + 1);
      if (new Date() > expiry) return res.status(403).send("다운로드 기간 만료");
    }

    // 책 정보 조회
    const book = await Book.findOne({ slug });
    if (!book || !book.fileName || !book.fileName.startsWith("https://")) {
      return res.status(400).send("유효한 ZIP URL 없음");
    }

    // Cloudflare ZIP URL 프록시 스트림
    https
      .get(book.fileName, (upstream) => {
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename="${slug}.zip"`);
        res.setHeader("Access-Control-Allow-Origin", "*");
        upstream.pipe(res);
      })
      .on("error", (err) => {
        console.error("유료 전자책 다운로드 오류:", err);
        res.status(500).send("다운로드 실패");
      });
  } catch (err) {
    console.error("다운로드 처리 중 오류:", err);
    res.status(500).send("다운로드 실패");
  }
});

export default router;

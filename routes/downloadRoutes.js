import express from "express";
import https from "https";
import { fileURLToPath } from "url";
import path from "path";
import { verifyToken } from "../middleware/auth.js";
import Book from "../models/Book.js";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Cloudflare R2 base URL (환경변수로 관리 가능)
const CLOUDFLARE_BASE = process.env.CLOUDFLARE_BASE_URL ||
  "https://pub-bb775a03143c476396cd5c6200cab293.r2.dev";

// 허용 Origin
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://careerbooks.shop", "https://www.careerbooks.shop"]
    : ["http://localhost:5173", "https://www.careerbooks.shop"];

function setCORSHeaders(res, origin) {
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
}

// 프리플라이트
router.options("*", (req, res) => {
  setCORSHeaders(res, req.headers.origin);
  res.sendStatus(200);
});

// 무료 전자책
router.get("/frontend00", (req, res) => {
  const origin = req.headers.origin;
  setCORSHeaders(res, origin);

  const url = `${CLOUDFLARE_BASE}/frontend00.zip`;
  https
    .get(url, (upstream) => {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="frontend00.zip"');
      upstream.pipe(res);
    })
    .on("error", (err) => {
      console.error("무료 전자책 다운로드 오류:", err);
      res.status(500).send("무료 전자책 다운로드 실패");
    });
});

// 유료 전자책
router.get("/:slug", verifyToken, async (req, res) => {
  const { slug } = req.params;
  const origin = req.headers.origin;
  setCORSHeaders(res, origin);

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).send("사용자 없음");

    const owns = user.purchasedBooks.some(pb =>
      typeof pb === "string" ? pb === slug : pb.slug === slug
    );
    if (!owns) return res.status(403).send("구매하지 않은 책");

    const record = user.purchasedBooks.find(pb =>
      typeof pb === "string" ? pb === slug : pb.slug === slug
    );
    const purchasedAt = typeof record === "string" ? null : new Date(record.purchasedAt);
    if (purchasedAt) {
      const expiry = new Date(purchasedAt);
      expiry.setFullYear(expiry.getFullYear() + 1);
      if (new Date() > expiry) return res.status(403).send("다운로드 기간 만료");
    }

    // Cloudflare URL 직접 구성
    const zipUrl = `${CLOUDFLARE_BASE}/${slug}.zip`;
    https
      .get(zipUrl, (upstream) => {
        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${slug}.zip"`
        );
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

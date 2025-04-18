import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DESC_FOLDER = path.join(__dirname, "../descriptions");

if (!fs.existsSync(DESC_FOLDER)) {
  fs.mkdirSync(DESC_FOLDER);
}

const router = express.Router();

// ✅ 전체 or 카테고리별 도서 목록
router.get("/", async (req, res) => {
  const { category } = req.query;
  try {
    const query = category ? { category } : {};
    const books = await Book.find(query).sort({ titleIndex: 1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "책 목록을 불러오는 중 오류 발생" });
  }
});

// ✅ 카테고리별 도서 (경로 방식)
router.get("/category/:category", async (req, res) => {
  try {
    const books = await Book.find({ category: req.params.category }).sort({ titleIndex: 1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "카테고리별 책 조회 실패" });
  }
});

// ✅ 내가 구매한 책
router.get("/my-books", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: "사용자 없음" });

  const purchasedBooks = await Promise.all(
    user.purchasedBooks.map(async (pb) => {
      const slug = typeof pb === "string" ? pb : pb.slug;
      const purchasedAt = typeof pb === "string" ? null : pb.purchasedAt;
      const book = await Book.findOne({ slug });
      if (!book) return null;
      return {
        title: book.title,
        slug: book.slug,
        fileName: book.fileName,
        purchasedAt: purchasedAt || new Date(0),
        kmongUrl: book.kmongUrl || "",
      };
    })
  );

  res.json(purchasedBooks.filter(Boolean));
});

// ✅ 인기 도서 (salesCount 기준)
router.get("/popular", async (req, res) => {
  try {
    const books = await Book.find().sort({ salesCount: -1 }).limit(3);
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 설명 불러오기
router.get("/:slug/description", async (req, res) => {
  try {
    const filePath = path.join(DESC_FOLDER, `${req.params.slug}.md`);
    if (!fs.existsSync(filePath)) {
      return res.json({ description: "" });
    }
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ description: content });
  } catch (err) {
    console.error("설명 불러오기 오류:", err);
    res.status(500).json({ message: "설명을 불러오는 중 오류 발생" });
  }
});

// ✅ 설명 저장하기 (관리자만)
router.put("/:slug/description", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "권한 없음" });
  }

  try {
    const filePath = path.join(DESC_FOLDER, `${req.params.slug}.md`);
    fs.writeFileSync(filePath, req.body.description || "", "utf-8");
    res.json({ message: "설명이 저장되었습니다." });
  } catch (err) {
    console.error("설명 저장 오류:", err);
    res.status(500).json({ message: "설명 저장 중 오류 발생" });
  }
});

// ✅ 구매 여부 확인
router.get("/:slug/access", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ allowed: false });

  const hasBook = user.purchasedBooks.some((pb) =>
    typeof pb === "string" ? pb === req.params.slug : pb.slug === req.params.slug
  );

  res.json({ allowed: hasBook });
});

// ✅ 구매 처리
router.post("/:slug/purchase", verifyToken, async (req, res) => {
  const { slug } = req.params;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: "사용자 없음" });

  const alreadyPurchased = user.purchasedBooks.some((pb) =>
    typeof pb === "string" ? pb === slug : pb.slug === slug
  );
  if (alreadyPurchased) {
    return res.status(400).json({ message: "이미 구매한 책입니다." });
  }

  user.purchasedBooks.push({ slug, purchasedAt: new Date() });
  await user.save();
  await Book.findOneAndUpdate({ slug }, { $inc: { salesCount: 1 } });

  res.json({ message: "구매 완료" });
});

// ✅ 책 상세 조회
router.get("/:slug", async (req, res) => {
  const book = await Book.findOne({ slug: req.params.slug });
  if (!book) return res.status(404).json({ message: "책을 찾을 수 없습니다." });

  res.json({
    _id: book._id,
    title: book.title,
    titleIndex: book.titleIndex,
    slug: book.slug,
    category: book.category,
    price: book.price,
    originalPrice: book.originalPrice,
    description: book.description,
    kmongUrl: book.kmongUrl || "",
  });
});

export default router;

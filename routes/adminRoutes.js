import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import User from "../models/User.js";
import Book from "../models/Book.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLIDES_FILE = path.join(__dirname, "../data/slides.json");

// ✅ 관리자 인증 미들웨어
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "인증 정보가 없습니다." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ message: "관리자 권한이 없습니다." });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error("인증 실패:", err);
    return res.status(401).json({ message: "토큰이 유효하지 않습니다." });
  }
}

// ✅ 슬라이드 로딩 함수
function loadSlides() {
  if (!fs.existsSync(SLIDES_FILE)) return [];
  const data = fs.readFileSync(SLIDES_FILE, "utf-8");
  return JSON.parse(data);
}

// ✅ 슬라이드 불러오기
router.get("/slides", (req, res) => {
  const slides = loadSlides();
  res.json(slides);
});

// ✅ 업로드 디렉토리 생성
const uploadPath = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${req.body.slug}.zip`);
  },
});

const upload = multer({ storage });

/* -------------------------- 관리자 API -------------------------- */

// ✅ 회원 목록 조회
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("회원 목록 조회 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 전자책 등록
router.post("/books", verifyAdmin, upload.single("file"), async (req, res) => {
  const {
    title,
    slug,
    category,
    description,
    originalPrice,
    price,
    titleIndex,
    kmongUrl,
  } = req.body;

  const file = req.file;

  if (
    !title ||
    !slug ||
    !category ||
    !description ||
    !originalPrice ||
    !price ||
    !titleIndex ||
    !file
  ) {
    return res.status(400).json({ message: "모든 필드를 입력해주세요." });
  }

  try {
    const existingSlug = await Book.findOne({ slug });
    if (existingSlug) {
      return res.status(400).json({ message: "이미 존재하는 슬러그입니다." });
    }

    const existingIndex = await Book.findOne({
      titleIndex: parseInt(titleIndex),
    });
    if (existingIndex) {
      return res.status(400).json({ message: "이미 존재하는 인덱스입니다." });
    }

    const newBook = new Book({
      title,
      slug,
      category,
      fileName: file.filename,
      description,
      originalPrice: parseInt(originalPrice),
      price: parseInt(price),
      titleIndex: parseInt(titleIndex),
      kmongUrl: kmongUrl || "",
    });

    await newBook.save();
    res.json({ message: "전자책 등록 완료", book: newBook });
  } catch (err) {
    console.error("전자책 등록 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 전자책 삭제
router.delete("/books/:id", verifyAdmin, async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "삭제 완료" });
  } catch (err) {
    console.error("삭제 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 전자책 수정
router.put("/books/:id", verifyAdmin, async (req, res) => {
  const {
    title,
    slug,
    description,
    originalPrice,
    price,
    titleIndex,
    category,
    kmongUrl,
  } = req.body;

  try {
    const existingIndex = await Book.findOne({
      _id: { $ne: req.params.id },
      titleIndex: parseInt(titleIndex),
    });

    if (existingIndex) {
      return res.status(400).json({ message: "이미 존재하는 인덱스입니다." });
    }

    const existingBook = await Book.findById(req.params.id);
    if (!existingBook) {
      return res.status(404).json({ message: "책을 찾을 수 없습니다." });
    }

    const updated = await Book.findByIdAndUpdate(
      req.params.id,
      {
        title,
        slug,
        description,
        originalPrice: parseInt(originalPrice),
        price: parseInt(price),
        titleIndex: parseInt(titleIndex),
        category,
        fileName: existingBook.fileName,
        kmongUrl: kmongUrl || "",
      },
      { new: true }
    );

    res.json({ message: "수정 완료", book: updated });
  } catch (err) {
    console.error("수정 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;

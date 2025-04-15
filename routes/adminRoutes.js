import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import User from "../models/User.js";
import Book from "../models/Book.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLIDES_FILE = path.join(__dirname, "../data/slides.json");

function loadSlides() {
  if (!fs.existsSync(SLIDES_FILE)) return [];
  const data = fs.readFileSync(SLIDES_FILE, "utf-8");
  return JSON.parse(data);
}

router.get("/slides", (req, res) => {
  const slides = loadSlides();
  res.json(slides);
});

// ✅ 업로드 디렉토리 설정
const uploadPath = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${req.body.slug}.zip`); // slug 기반 파일명
  },
});

const upload = multer({ storage });

// ✅ 회원 목록 조회
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("회원 목록 조회 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 전자책 등록
router.post("/books", upload.single("file"), async (req, res) => {
	const {
	  title,
	  slug,
	  category,
	  description,
	  originalPrice,
	  price,
	  titleIndex,
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
  
	  const existingIndex = await Book.findOne({ titleIndex: parseInt(titleIndex) });
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
	  });
  
	  await newBook.save();
  
	  res.json({ message: "전자책 등록 완료", book: newBook });
	} catch (err) {
	  console.error("전자책 등록 실패:", err);
	  res.status(500).json({ message: "서버 오류" });
	}
  });

  // ✅ 전자책 삭제
router.delete("/books/:id", async (req, res) => {
	try {
	  await Book.findByIdAndDelete(req.params.id);
	  res.json({ message: "삭제 완료" });
	} catch (err) {
	  console.error("삭제 실패:", err);
	  res.status(500).json({ message: "서버 오류" });
	}
  });
  
  // ✅ 전자책 수정
  router.put("/books/:id", async (req, res) => {
	try {
	  const {
		title,
		slug,
		description,
		originalPrice,
		price,
		titleIndex,
		category,
	  } = req.body;
  
	  const existingIndex = await Book.findOne({
		_id: { $ne: req.params.id },
		titleIndex: titleIndex,
	  });
  
	  if (existingIndex) {
		return res.status(400).json({ message: "이미 존재하는 인덱스입니다." });
	  }
  
	  const updated = await Book.findByIdAndUpdate(
		req.params.id,
		{
		  title,
		  slug,
		  description,
		  originalPrice,
		  price,
		  titleIndex,
		  category,
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

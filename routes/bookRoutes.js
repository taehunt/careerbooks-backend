import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Book from "../models/Book.js";
import User from "../models/User.js";

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
    const books = await Book.find({ category: req.params.category }).sort({
      titleIndex: 1,
    });
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

// ✅ 서비스 설명 가져오기
router.get("/:slug/service", async (req, res) => {
  try {
    const book = await Book.findOne({ slug: req.params.slug });
    if (!book)
      return res.status(404).json({ message: "책을 찾을 수 없습니다." });
    res.json({ serviceDetail: book.serviceDetail || "" });
  } catch (err) {
    console.error("서비스 설명 조회 오류:", err);
    res.status(500).json({ message: "오류 발생" });
  }
});

// ✅ 서비스 설명 저장하기 (관리자)
router.put("/:slug/service", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "권한 없음" });
  }

  const { serviceDetail } = req.body;

  try {
    const book = await Book.findOneAndUpdate(
      { slug: req.params.slug },
      { serviceDetail: serviceDetail || "" },
      { new: true }
    );
    if (!book)
      return res.status(404).json({ message: "책을 찾을 수 없습니다." });

    res.json({ message: "서비스 설명 저장 완료", book });
  } catch (err) {
    console.error("서비스 설명 저장 오류:", err);
    res.status(500).json({ message: "저장 중 오류 발생" });
  }
});

// ✅ 구매 여부 확인
router.get("/:slug/access", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ allowed: false });

  const hasBook = user.purchasedBooks.some((pb) =>
    typeof pb === "string"
      ? pb === req.params.slug
      : pb.slug === req.params.slug
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
    serviceDetail: book.serviceDetail || "",
    kmongUrl: book.kmongUrl || "",
  });
});

// ✅ 책 기본 정보(부제목 등) 업데이트 라우트 추가
router.put("/:slug", verifyToken, async (req, res) => {
	const user = await User.findById(req.user.id);
	if (!user || user.role !== "admin") {
	  return res.status(403).json({ message: "권한 없음" });
	}
  
	try {
	  const updatedBook = await Book.findOneAndUpdate(
		{ slug: req.params.slug },
		req.body,
		{ new: true }
	  );
	  if (!updatedBook) {
		return res.status(404).json({ message: "책을 찾을 수 없습니다." });
	  }
	  res.json({ message: "책 정보 업데이트 완료", book: updatedBook });
	} catch (err) {
	  console.error("책 정보 업데이트 오류:", err);
	  res.status(500).json({ message: "업데이트 중 오류 발생" });
	}
  });

export default router;

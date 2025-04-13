import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Book from '../models/Book.js';
import User from '../models/User.js';

const router = express.Router();

// ✅ 1. /api/books → 전체 or category별 전자책 목록 (쿼리 방식)
router.get('/', async (req, res) => {
  const { category } = req.query;
  try {
    const query = category ? { category } : {};
    const books = await Book.find(query).sort({ titleIndex: 1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: '책 목록을 불러오는 중 오류 발생' });
  }
});

// ✅ 2. /api/books/category/:category → 경로 방식 지원 추가 (슬러그 충돌 방지용)
router.get('/category/:category', async (req, res) => {
  const { category } = req.params;
  try {
    const books = await Book.find({ category }).sort({ titleIndex: 1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: '카테고리별 책 조회 실패' });
  }
});

// ✅ 3. 내가 구매한 책 목록
router.get('/my-books', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: '사용자 없음' });

  const purchasedBooks = await Promise.all(
    user.purchasedBooks.map(async (pb) => {
      const slug = typeof pb === 'string' ? pb : pb.slug;
      const purchasedAt = typeof pb === 'string' ? null : pb.purchasedAt;
      const book = await Book.findOne({ slug });
      if (!book) return null;

      return {
        title: book.title,
        slug: book.slug,
        fileName: book.fileName,
        purchasedAt: purchasedAt || new Date(0),
      };
    })
  );

  res.json(purchasedBooks.filter((b) => b !== null));
});

// ✅ 4. 구매 여부 확인
router.get('/:slug/access', verifyToken, async (req, res) => {
  const { slug } = req.params;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ allowed: false });

  const hasBook = user.purchasedBooks.some(
    (pb) => (typeof pb === 'string' ? pb === slug : pb.slug === slug)
  );

  return res.json({ allowed: hasBook });
});

// ✅ 5. 책 구매 API
router.post('/:slug/purchase', verifyToken, async (req, res) => {
  const { slug } = req.params;
  const user = await User.findById(req.user.id);

  if (!user) return res.status(401).json({ message: '사용자 없음' });

  const alreadyPurchased = user.purchasedBooks.some(
    (pb) => (typeof pb === 'string' ? pb === slug : pb.slug === slug)
  );
  if (alreadyPurchased) {
    return res.status(400).json({ message: '이미 구매한 책입니다.' });
  }

  user.purchasedBooks.push({ slug, purchasedAt: new Date() });
  await user.save();

  res.json({ message: '구매 완료' });
});

// ✅ 6. 책 상세 조회 (마지막에 위치시켜야 슬러그 충돌 방지)
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const book = await Book.findOne({ slug });
  if (!book) return res.status(404).json({ message: '책을 찾을 수 없습니다.' });
  res.json(book);
});

export default router;

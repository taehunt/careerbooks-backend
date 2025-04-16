import express from 'express';
import path from 'path';
import { verifyToken } from '../middleware/auth.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();

// 현재 파일의 절대 경로 설정 (ESM 환경용)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ 무료 전자책은 인증 없이 다운로드 허용
router.get('/frontend00', async (req, res) => {
  try {
	const filePath = path.join(__dirname, '..', '..', 'uploads', 'frontend00.zip');
    res.download(filePath, 'frontend00.zip');
  } catch (err) {
    console.error('무료 전자책 다운로드 오류:', err);
    res.status(500).send('무료 전자책 다운로드 실패');
  }
});

// ✅ 유료 전자책은 인증 및 구매 내역 확인
router.get('/:slug', verifyToken, async (req, res) => {
  const { slug } = req.params;

  try {
    const user = await User.findById(req.user.id);
    const book = await Book.findOne({ slug });

    if (!book) {
      return res.status(404).send('책을 찾을 수 없습니다.');
    }

    const bookRecord = user.purchasedBooks.find((item) =>
      typeof item === 'string' ? item === slug : item.slug === slug
    );

    if (!bookRecord) {
      return res.status(403).send('구매하지 않은 책입니다.');
    }

    const purchasedAt = typeof bookRecord === 'string' ? null : new Date(bookRecord.purchasedAt);
    if (purchasedAt) {
      const expired = new Date(purchasedAt);
      expired.setFullYear(expired.getFullYear() + 1);
      if (new Date() > expired) {
        return res.status(403).send('다운로드 기간이 만료되었습니다.');
      }
    }

	const filePath = path.join(__dirname, '..', '..', 'uploads', book.fileName);
    res.download(filePath, book.fileName);
  } catch (err) {
    console.error('파일 다운로드 오류:', err);
    res.status(500).send('다운로드 실패');
  }
});

export default router;

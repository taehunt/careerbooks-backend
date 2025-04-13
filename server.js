import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import downloadRoutes from './routes/downloadRoutes.js';

import User from './models/User.js';
import Book from './models/Book.js';

dotenv.config();
const app = express();

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://careerbooks.shop', 'http://careerbooks.shop']
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/downloads', downloadRoutes);

/*
// ✅ 추후 전자책 추가 시
const books = [
  {
    titleIndex: 1,
    title: "진짜 생초보를 위한 웹사이트 만들기",
    slug: "frontend01",
    description: "HTML부터 CSS까지 웹사이트 기초를 완전 정복하는 입문서",
    fileName: "frontend01.zip",
    category: "frontend"
  }
];*/

// ✅ DB 연결 및 초기화 조건 처리
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    // 🔧 유저 마이그레이션
    const users = await User.find();
    for (const user of users) {
      if (user.purchasedBooks.length > 0 && typeof user.purchasedBooks[0] === 'string') {
        user.purchasedBooks = user.purchasedBooks.map(slug => ({
          slug,
          purchasedAt: new Date()
        }));
        await user.save();
        console.log(`✅ 유저 ${user.userId} 마이그레이션 완료`);
      }
    }

    // 📚 책 데이터가 없을 때만 초기화
    const bookCount = await Book.countDocuments();
    if (bookCount === 0) {
      await Book.insertMany(books);
      console.log("✅ 전자책 샘플 데이터 초기화 완료");
    } else {
      console.log(`✅ 책 데이터 이미 존재 (${bookCount}권). 초기화 생략`);
    }

    // 🚀 서버 시작
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ 서버 시작됨: http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error('❌ MongoDB 연결 실패:', err));

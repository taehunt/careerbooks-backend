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

// ✅ CORS 설정 (배포 도메인 허용)
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

// ✅ 라우터 등록
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/downloads', downloadRoutes);

// ✅ 전자책 샘플 데이터
const books = [
  {
    title: "진짜 생초보를 위한 웹사이트 만들기",
    slug: "frontend01",
    description: "HTML부터 CSS까지 웹사이트 기초를 완전 정복하는 입문서",
    fileName: "frontend01.zip"
  },
  {
    title: "웹사이트 실전 프로젝트 따라하기",
    slug: "frontend02",
    description: "실제 예제를 따라하며 포트폴리오를 만드는 실전 전자책",
    fileName: "frontend02.zip"
  },
  {
    title: "진짜 웹 서비스 만들기",
    slug: "frontend03",
    description: "React + Express + MongoDB로 웹 앱 전체를 구현해보세요",
    fileName: "frontend03.zip"
  },
  {
    title: "진짜 실무 레이아웃 클론 코딩",
    slug: "frontend04",
    description: "기업 웹사이트처럼 보이는 레이아웃 클론 실습",
    fileName: "frontend04.zip"
  },
  {
    title: "진짜 포트폴리오용 웹사이트 만들기",
    slug: "frontend05",
    description: "디자인 + 기능 + 배포까지 가능한 포트폴리오용 완성형 전자책",
    fileName: "frontend05.zip"
  },
  {
    title: "진짜 실무 리액트 앱 구조 설계",
    slug: "frontend06",
    description: "상태관리, 폴더구조, 인증까지 다루는 중급자용 전자책",
    fileName: "frontend06.zip"
  }
];

// ✅ DB 연결 및 마이그레이션 + 책 초기화 + 서버 실행
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    // 🔧 유저 데이터 마이그레이션
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

    // 📚 책 데이터 초기화
    await Book.deleteMany({});
    await Book.insertMany(books);
    console.log("✅ 전자책 6개 초기화 완료");

    // 🚀 서버 시작
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ 서버 시작됨: http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error('❌ MongoDB 연결 실패:', err));
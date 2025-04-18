// root/server/server.js

import express from "express";
import path, { dirname as _dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";

// Routes
import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import downloadRoutes from "./routes/downloadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import slideRoutes from "./routes/slideRoutes.js";

// Models
import User from "./models/User.js";
import Book from "./models/Book.js";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

const app = express();

// ESM 환경에서 __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = _dirname(__filename);

// 1) 클라이언트 public/images 폴더 정적 서빙
app.use(
  "/images",
  express.static(path.join(__dirname, "../client/public/images"))
);

// 2) CORS 설정
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://careerbooks.shop", "https://www.careerbooks.shop"]
    : ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "careerbooks-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    },
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 3) 슬라이드 전용 라우트
app.use("/api/admin/slides", slideRoutes);

// 기존 API 라우트
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/downloads", downloadRoutes);

// 헬스 체크
app.get("/api/ping", (req, res) => {
  res.send("pong");
});

// DB 연결 및 서버 시작
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    // 구매 기록 마이그레이션
    const users = await User.find();
    for (const user of users) {
      if (
        user.purchasedBooks.length > 0 &&
        typeof user.purchasedBooks[0] === "string"
      ) {
        user.purchasedBooks = user.purchasedBooks.map((slug) => ({
          slug,
          purchasedAt: new Date(),
        }));
        await user.save();
        console.log(`✅ 유저 ${user.userId} 마이그레이션 완료`);
      }
    }

    // 책 데이터 확인
    const bookCount = await Book.countDocuments();
    if (bookCount === 0) {
      // 초기 데이터 삽입 가능
    } else {
      console.log(`✅ 책 데이터 이미 존재 (${bookCount}권). 초기화 생략`);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ 서버 시작됨: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패:", err);
  });

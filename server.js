// server/server.js
import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import fileUpload from "express-fileupload";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cookieParser from "cookie-parser";
import session from "express-session";

// Routes
import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import downloadRoutes from "./routes/downloadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// API
import User from "./models/User.js";
import Book from "./models/Book.js";

// ✅ NODE_ENV에 따라 해당 .env 파일 불러오기
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: envFile });

const app = express();

// ✅ CORS 설정 (요청 origin 로그 추가)
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        "https://careerbooks.shop",
        "http://careerbooks.shop",
        "https://www.careerbooks.shop",
        "http://www.careerbooks.shop",
        "https://api.careerbooks.shop",
      ]
    : ["http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🌐 요청 Origin:", origin); // ✅ origin 로그 출력
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("⛔ CORS 차단된 Origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
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
      sameSite: "lax",
    },
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/downloads", downloadRoutes);

app.get("/api/ping", (req, res) => {
  res.send("pong");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
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

    const bookCount = await Book.countDocuments();
    if (bookCount === 0) {
      // 샘플 책 데이터 초기화 가능
    } else {
      console.log(`✅ 책 데이터 이미 존재 (${bookCount}권). 초기화 생략`);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ 서버 시작됨: http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));

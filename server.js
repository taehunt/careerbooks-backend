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

// Models
import User from "./models/User.js";
import Book from "./models/Book.js";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

const app = express();

// 1) 이미지 정적 서빙
app.use(
  "/images",
  express.static(path.join(__dirname, "../client/public/images"))
);

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [ /* production origins */ ]
    : ["http://localhost:5173"];

// 2) CORS 설정 (슬라이드 라우트에도 헤더가 붙습니다)
app.use(
  cors({
    origin: (origin, callback) =>
      !origin || allowedOrigins.includes(origin)
        ? callback(null, true)
        : callback(new Error("Not allowed by CORS")),
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
      sameSite: "none",
    },
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 3) 슬라이드 전용 라우트 마운트 (CORS 이후에)
import slideRoutes from "./routes/slideRoutes.js";
app.use("/api/admin/slides", slideRoutes);

// 기존 API 라우트
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/downloads", downloadRoutes);

app.get("/api/ping", (req, res) => res.send("pong"));

// DB 연결 및 서버 시작
mongoose
  .connect(process.env.MONGO_URI)
  .then(/* ... */)
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));
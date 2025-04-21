// 파일 경로: root/server/routes/adminRoutes.js

import express from "express";
import Book from "../models/Book.js";
import User from "../models/User.js";
import PurchaseRequest from "../models/PurchaseRequest.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import nodemailer from "nodemailer";
import axios from "axios";

const router = express.Router();

// 관리자 전용: 모든 사용자 목록 조회
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password"); // 비밀번호 제외
    res.json(users);
  } catch (err) {
    console.error("회원 목록 조회 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 관리자 전용: 전자책 등록
router.post("/books", verifyAdmin, async (req, res) => {
  const {
    title,
    slug,
    description,
    originalPrice,
    price,
    titleIndex,
    category,
    kmongUrl,
    zipUrl,
  } = req.body;

  try {
    if (await Book.findOne({ slug })) {
      return res.status(400).json({ message: "이미 존재하는 슬러그입니다." });
    }
    if (await Book.findOne({ titleIndex: parseInt(titleIndex) })) {
      return res.status(400).json({ message: "이미 존재하는 인덱스입니다." });
    }

    const newBook = await Book.create({
      title,
      slug,
      description,
      originalPrice: parseInt(originalPrice),
      price: parseInt(price),
      titleIndex: parseInt(titleIndex),
      category,
      fileName: zipUrl,
      kmongUrl: kmongUrl || "",
    });

    res.status(201).json({ message: "등록 완료", book: newBook });
  } catch (err) {
    console.error("등록 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 관리자 전용: 전자책 수정
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
    zipUrl,
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
        fileName: zipUrl || existingBook.fileName,
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

// 관리자 전용: 전자책 삭제
router.delete("/books/:id", verifyAdmin, async (req, res) => {
  try {
    const deleted = await Book.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "책을 찾을 수 없습니다." });
    }
    res.json({ message: "삭제 완료" });
  } catch (err) {
    console.error("삭제 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 관리자 전용: 유저의 purchasedBooks 갱신
router.post("/confirm-purchase", verifyAdmin, async (req, res) => {
  const { userId, slug } = req.body;
  if (!userId || !slug) return res.status(400).json({ message: "필수 정보 누락" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "유저를 찾을 수 없습니다." });

    const alreadyPurchased = user.purchasedBooks?.some((b) => b.slug === slug);
    if (alreadyPurchased) return res.status(400).json({ message: "이미 구매한 전자책입니다." });

    user.purchasedBooks.push({ slug, purchasedAt: new Date() });
    await user.save();

    res.json({ message: "구매 확정 완료" });
  } catch (err) {
    console.error("구매 확정 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 관리자 전용: 전자책 구매자 이메일로 ZIP 발송
router.post("/send-ebook", verifyAdmin, async (req, res) => {
  const { email, fileName, title } = req.body;
  if (!email || !fileName) {
    return res.status(400).json({ message: "필수 정보 누락" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const fileUrl = `https://pub-bb775a03143c476396cd5c6200cab293.r2.dev/${fileName}`;
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const attachmentBuffer = Buffer.from(response.data, "binary");

    await transporter.sendMail({
      from: `"CareerBooks" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[CareerBooks] "${title}" 전자책 첨부파일`,
      text: `"${title}" 전자책을 첨부파일로 전달드립니다.`,
      attachments: [
        {
          filename: fileName,
          content: attachmentBuffer,
        },
      ],
    });

    res.json({ message: "이메일 전송 완료" });
  } catch (err) {
    console.error("이메일 전송 오류:", err.message);
    res.status(500).json({ message: "이메일 전송 실패" });
  }
});

export default router;

// 📁 파일 위치: server/routes/descriptionRoutes.js
import express from "express";
import BookDescription from "../models/BookDescription.js";

const router = express.Router();

// GET /api/descriptions/:slug
router.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const entry = await BookDescription.findOne({ slug });
    if (!entry) return res.status(404).json({ message: "설명 없음" });
    res.set("Content-Type", "text/html");
    res.send(entry.content); // HTML로 처리됨
  } catch (err) {
    console.error("설명 조회 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// PUT /api/descriptions/:slug
router.put("/:slug", async (req, res) => {
  const { slug } = req.params;
  const { content } = req.body;
  try {
    const result = await BookDescription.findOneAndUpdate(
      { slug },
      { content },
      { upsert: true, new: true }
    );
    res.json({ message: "저장 완료", result });
  } catch (err) {
    console.error("설명 저장 실패:", err);
    res.status(500).json({ message: "저장 중 오류 발생" });
  }
});

export default router;
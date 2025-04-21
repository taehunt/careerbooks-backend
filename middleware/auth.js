// 파일 경로: server/middleware/auth.js

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1] || req.query.token;

  if (!token) {
    return res.status(401).json({ message: '토큰 없음' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded._id).select("-password");

    if (!user) {
      return res.status(401).json({ message: '사용자를 찾을 수 없음' });
    }

    req.user = user; // 이제 req.user에서 userId, nickname 사용 가능
    next();
  } catch (err) {
    console.error("토큰 검증 실패:", err.message);
    res.status(403).json({ message: '토큰 유효하지 않음' });
  }
};

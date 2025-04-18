// 파일 경로: root/server/middleware/auth.js

import jwt from 'jsonwebtoken';

// JWT 기반 토큰 검증 미들웨어
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: '토큰 없음' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: '토큰 유효하지 않음' });
  }
};

// 관리자 권한 검증 미들웨어
export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }
    next();
  });
};

// root/server/middleware/auth.js

import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  // 1) Authorization header 또는 ?token=으로 전달된 토큰 모두 허용
  const authHeader = req.headers.authorization;
  let token = authHeader?.split(' ')[1] || req.query.token;
  if (!token) {
    return res.status(401).json({ message: '토큰 없음' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: '토큰 유효하지 않음' });
  }
};

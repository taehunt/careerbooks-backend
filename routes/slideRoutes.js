// server/routes/slideRoutes.js
import express from "express";
const router = express.Router();

// 슬라이드 데이터 정의
const slides = [
	{
	  image: "/images/slide1.jpg",
	  bgColor: "#1e293b",              // 배경색 (optional)
	  title: "커리어를 바꾸는 첫걸음", // 주요 제목
	  subtitle: "지금 시작해보세요!",   // 부제목
	  button1: "전자책 둘러보기",       // 첫 번째 버튼 텍스트
	  button1Url: "/books",            // 첫 번째 버튼 링크
	  button2: "회원가입",             // 두 번째 버튼 텍스트
	  button2Url: "/signup",           // 두 번째 버튼 링크
	  textAlign: "center",             // 텍스트 정렬
	  fontSize: "48px",                // 제목 폰트 크기
	},
	{
	  image: "/images/slide2.jpg",
	  bgColor: "#0f172a",
	  title: "전문가와 함께 배우기",
	  subtitle: "실전 예제로 학습하세요",
	  button1: "인기 전자책",
	  button1Url: "/books?category=frontend",
	  button2: "로그인",
	  button2Url: "/login",
	  textAlign: "left",
	  fontSize: "44px",
	},
  ];
  
  // GET /api/admin/slides
  router.get("/", (req, res) => {
	res.json(slides);
  });
  
  export default router;
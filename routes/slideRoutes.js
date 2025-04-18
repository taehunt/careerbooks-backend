import express from 'express';
const router = express.Router();

const slides = [
  {
    image: '/images/slide1.jpg',
    bgColor: '#1e293b',
    title: '커리어를 바꾸는 첫걸음',
    subtitle: '지금 시작해보세요!',
    button1: '전자책 둘러보기',
    button1Url: '/books',
    button2: '회원가입',
    button2Url: '/signup',
    textAlign: 'center',
    fontSize: '48px',
  },
  {
    image: '/images/slide2.jpg',
    bgColor: '#0f172a',
    title: '전문가와 함께 배우기',
    subtitle: '실전 예제로 학습하세요',
    button1: '인기 전자책',
    button1Url: '/books?category=frontend',
    button2: '로그인',
    button2Url: '/login',
    textAlign: 'left',
    fontSize: '44px',
  },
  {
    image: '/images/slide3.jpg',
    bgColor: '#111827',
    title: '나만의 공부 스케줄',
    subtitle: '언제 어디서나 학습 가능',
    button1: '내 책보기',
    button1Url: '/my-books',
    button2: '홈으로',
    button2Url: '/',
    textAlign: 'center',
    fontSize: '46px',
  },
  {
    image: '/images/slide4.jpg',
    bgColor: '#1f2937',
    title: '최신 트렌드 반영',
    subtitle: '최신 웹 기술 완벽 정리',
    button1: '전자책 목록',
    button1Url: '/books',
    button2: null,
    button2Url: null,
    textAlign: 'right',
    fontSize: '42px',
  },
];

router.get('/', (req, res) => {
  res.json(slides);
});

export default router;
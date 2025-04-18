// ✅ 전자책 수정
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
	  zipUrl, // ✅ Cloudflare ZIP 파일 URL 추가
	} = req.body;
  
	try {
	  // ✅ 인덱스 중복 검사
	  const existingIndex = await Book.findOne({
		_id: { $ne: req.params.id },
		titleIndex: parseInt(titleIndex),
	  });
  
	  if (existingIndex) {
		return res.status(400).json({ message: "이미 존재하는 인덱스입니다." });
	  }
  
	  // ✅ 기존 도서 찾기
	  const existingBook = await Book.findById(req.params.id);
	  if (!existingBook) {
		return res.status(404).json({ message: "책을 찾을 수 없습니다." });
	  }
  
	  // ✅ 업데이트 실행 (zipUrl이 있으면 교체, 없으면 기존값 유지)
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
		  fileName: zipUrl || existingBook.fileName, // ✅ 핵심: Cloudflare 주소로 대체
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
  
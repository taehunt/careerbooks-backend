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
	  zipUrl, // ✅ 추가
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
		  fileName: zipUrl || existingBook.fileName, // ✅ 핵심 수정
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
  
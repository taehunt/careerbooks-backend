import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: String,
    slug: { type: String, unique: true },
	description: { type: String, default: "" },
    fileName: String,
    category: String,
    titleIndex: Number,
    price: Number,
    originalPrice: Number,

	// ✅ 크몽 판매 링크
    kmongUrl: {
      type: String,
      default: "",
    },

    // ✅ 판매 횟수 증가
    salesCount: {
      type: Number,
      default: 0,
    },
	serviceDetail: { type: String, default: "" },
  },
  { timestamps: true }
);

const Book = mongoose.model("Book", bookSchema);
export default Book;

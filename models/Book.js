import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: String,
    slug: { type: String, unique: true },
    description: String,
    fileName: String,
    category: String,
    titleIndex: Number,
    price: Number,
    originalPrice: Number,
  },
  { timestamps: true }
);

const Book = mongoose.model("Book", bookSchema);
export default Book;
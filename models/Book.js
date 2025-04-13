import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    fileName: { type: String, required: true },
    category: { type: String, required: true },
    titleIndex: { type: Number, required: true },
    price: Number,
  },
  { timestamps: true }
);

const Book = mongoose.model("Book", bookSchema);
export default Book;

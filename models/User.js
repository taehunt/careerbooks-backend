import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String, required: true },
  role: { type: String, default: "user" },
  purchasedBooks: [
    {
      slug: { type: String, required: true },
      purchasedAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

export default mongoose.model("User", userSchema);

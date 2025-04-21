import mongoose from "mongoose";

const purchaseRequestSchema = new mongoose.Schema(
  {
    depositor: { type: String, required: true },
    email: { type: String, required: true },
    slug: { type: String, required: true },
    memo: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("PurchaseRequest", purchaseRequestSchema);

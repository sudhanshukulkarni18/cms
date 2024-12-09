import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    opening: { type: String, required: true },
    subHeader1: { type: String },
    content1: { type: String },
    subHeader2: { type: String },
    content2: { type: String },
    cta: { type: String },
    media: { type: String, required: true }, // Store the image path or URL
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);

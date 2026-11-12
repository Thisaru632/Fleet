import mongoose, { Schema } from "mongoose";

const NoticeBannerSchema: Schema = new Schema(
  {
    title: { type: String, default: "Notice Banner" },
    imageUrl: { type: String, required: true },
    uploadedBy: { type: String, default: "VD0001" },
  },
  { timestamps: true }
);

NoticeBannerSchema.index({ createdAt: 1 });

export default mongoose.models.NoticeBanner || mongoose.model("NoticeBanner", NoticeBannerSchema);


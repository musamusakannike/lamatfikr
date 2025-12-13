import mongoose, { Schema } from "mongoose";

export interface Hashtag {
  tag: string;
  postCount: number;
  lastUsedAt: Date;
}

const HashtagSchema = new Schema<Hashtag>(
  {
    tag: { type: String, required: true, lowercase: true, trim: true },
    postCount: { type: Number, default: 0, min: 0 },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

HashtagSchema.index({ tag: 1 }, { unique: true });
HashtagSchema.index({ postCount: -1 });
HashtagSchema.index({ lastUsedAt: -1 });

export const HashtagModel =
  (mongoose.models.Hashtag as mongoose.Model<Hashtag>) ||
  mongoose.model<Hashtag>("Hashtag", HashtagSchema);

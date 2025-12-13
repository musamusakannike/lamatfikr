import mongoose, { Schema } from "mongoose";

import { SavedItemType, type SavedItemType as SavedItemTypeType } from "./common";
import type { ObjectId } from "./common";

export interface SavedItem {
  userId: ObjectId;
  itemType: SavedItemTypeType;
  itemId: ObjectId;
}

const SavedItemSchema = new Schema<SavedItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemType: {
      type: String,
      enum: Object.values(SavedItemType),
      required: true,
    },
    itemId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SavedItemSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });
SavedItemSchema.index({ userId: 1, createdAt: -1 });

export const SavedItemModel =
  (mongoose.models.SavedItem as mongoose.Model<SavedItem>) ||
  mongoose.model<SavedItem>("SavedItem", SavedItemSchema);

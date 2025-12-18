import mongoose, { Schema } from "mongoose";

export interface AppVisit {
  dateKey: string; // YYYY-MM-DD
  count: number;
}

const AppVisitSchema = new Schema<AppVisit>(
  {
    dateKey: { type: String, required: true, unique: true, index: true },
    count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const AppVisitModel =
  (mongoose.models.AppVisit as mongoose.Model<AppVisit>) ||
  mongoose.model<AppVisit>("AppVisit", AppVisitSchema);

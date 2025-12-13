import mongoose, { Schema } from "mongoose";

export interface Setting {
  key: string;
  value: unknown;
}

const SettingSchema = new Schema<Setting>(
  {
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

SettingSchema.index({ key: 1 }, { unique: true });

export const SettingModel =
  (mongoose.models.Setting as mongoose.Model<Setting>) ||
  mongoose.model<Setting>("Setting", SettingSchema);

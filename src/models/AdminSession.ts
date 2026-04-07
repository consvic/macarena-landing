import mongoose, { type InferSchemaType, type Model } from "mongoose";

const adminSessionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type AdminSessionDocument = InferSchemaType<typeof adminSessionSchema>;

export const AdminSessionModel: Model<AdminSessionDocument> =
  mongoose.models.AdminSession ??
  mongoose.model<AdminSessionDocument>("AdminSession", adminSessionSchema);

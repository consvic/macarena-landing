import mongoose, { type InferSchemaType, type Model } from "mongoose";

export const ADMIN_SESSION_COLLECTION_NAME = "admin-sessions";

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
    collection: ADMIN_SESSION_COLLECTION_NAME,
  },
);

export type AdminSessionDocument = InferSchemaType<typeof adminSessionSchema>;

function getAdminSessionModel() {
  const existingModel = mongoose.models.AdminSession as
    | Model<AdminSessionDocument>
    | undefined;
  if (!existingModel) {
    return mongoose.model<AdminSessionDocument>(
      "AdminSession",
      adminSessionSchema,
    );
  }

  if (existingModel.collection.name === ADMIN_SESSION_COLLECTION_NAME) {
    return existingModel;
  }

  mongoose.deleteModel("AdminSession");
  return mongoose.model<AdminSessionDocument>(
    "AdminSession",
    adminSessionSchema,
  );
}

export const AdminSessionModel: Model<AdminSessionDocument> =
  getAdminSessionModel();

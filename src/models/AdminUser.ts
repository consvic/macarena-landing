import {
  type InferSchemaType,
  model,
  models,
  Schema,
  type Types,
} from "mongoose";

const adminUserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type AdminUserDocument = InferSchemaType<typeof adminUserSchema> & {
  _id: Types.ObjectId;
};

export const AdminUserModel =
  models.AdminUser || model("AdminUser", adminUserSchema);

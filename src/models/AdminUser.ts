import mongoose, {
  type InferSchemaType,
  type Model,
  model,
  models,
  Schema,
  type Types,
} from "mongoose";

export const ADMIN_USER_COLLECTION_NAME = "admin-users";

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
    collection: ADMIN_USER_COLLECTION_NAME,
  },
);

export type AdminUserDocument = InferSchemaType<typeof adminUserSchema> & {
  _id: Types.ObjectId;
};

type AdminUserModelType = Model<AdminUserDocument>;

function getAdminUserModel() {
  const existingModel = models.AdminUser as AdminUserModelType | undefined;
  if (!existingModel) {
    return model<AdminUserDocument>("AdminUser", adminUserSchema);
  }

  if (existingModel.collection.name === ADMIN_USER_COLLECTION_NAME) {
    return existingModel;
  }

  mongoose.deleteModel("AdminUser");
  return model<AdminUserDocument>("AdminUser", adminUserSchema);
}

export const AdminUserModel = getAdminUserModel();

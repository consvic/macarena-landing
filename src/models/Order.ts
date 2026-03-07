import {
  type InferSchemaType,
  model,
  models,
  Schema,
  type Types,
} from "mongoose";

const orderSchema = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    customerPhone: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending_confirmation", "confirmed", "cancelled"],
      default: "pending_confirmation",
      required: true,
    },
    currency: { type: String, default: "MXN", required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    itemCount: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
    confirmedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type OrderDocument = InferSchemaType<typeof orderSchema> & {
  _id: Types.ObjectId;
};

export const OrderModel = models.Order || model("Order", orderSchema);

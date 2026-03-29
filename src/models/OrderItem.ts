import {
  type InferSchemaType,
  model,
  models,
  Schema,
  type Types,
} from "mongoose";
import { PRESENTATION_OPTIONS } from "@/lib/types";

const orderItemSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    flavorId: {
      type: Schema.Types.ObjectId,
      ref: "Flavor",
    },
    flavorName: { type: String, required: true, trim: true },
    presentation: {
      type: String,
      required: true,
      trim: true,
      enum: PRESENTATION_OPTIONS,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type OrderItemDocument = InferSchemaType<typeof orderItemSchema> & {
  _id: Types.ObjectId;
};

export const OrderItemModel =
  models.OrderItem || model("OrderItem", orderItemSchema);

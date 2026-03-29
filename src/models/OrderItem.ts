import {
  type InferSchemaType,
  model,
  models,
  Schema,
  type Types,
} from "mongoose";

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
      enum: ["1/2 litro", "1 litro"],
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

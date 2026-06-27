import mongoose, {
  type InferSchemaType,
  type Model,
  model,
  models,
  Schema,
  type Types,
} from "mongoose";
import { PRESENTATION_OPTIONS } from "@/lib/types";

export const ORDER_ITEM_COLLECTION_NAME = "order-items";

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
    collection: ORDER_ITEM_COLLECTION_NAME,
  },
);

export type OrderItemDocument = InferSchemaType<typeof orderItemSchema> & {
  _id: Types.ObjectId;
};

type OrderItemModelType = Model<OrderItemDocument>;

function getOrderItemModel() {
  const existingModel = models.OrderItem as OrderItemModelType | undefined;
  if (!existingModel) {
    return model<OrderItemDocument>("OrderItem", orderItemSchema);
  }

  if (existingModel.collection.name === ORDER_ITEM_COLLECTION_NAME) {
    return existingModel;
  }

  mongoose.deleteModel("OrderItem");
  return model<OrderItemDocument>("OrderItem", orderItemSchema);
}

export const OrderItemModel = getOrderItemModel();

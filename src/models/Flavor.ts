import { type InferSchemaType, model, models, Schema } from "mongoose";

const flavorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    base: { type: String, required: true, trim: true },
    tags: [{ type: String, required: true, trim: true }],
    price: {
      halfLiter: { type: Number, required: true, min: 0 },
      liter: { type: Number, required: true, min: 0 },
    },
    allergens: { type: String, required: true, trim: true },
    gradient: { type: String, required: true, trim: true },
    coverImage: { type: String, required: true, trim: true },
    exists: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type FlavorDocument = InferSchemaType<typeof flavorSchema>;

export const FlavorModel = models.Flavor || model("Flavor", flavorSchema);

import { type InferSchemaType, model, models, Schema } from "mongoose";

const flavorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    base: { type: String, required: true, trim: true },
    intensity: { type: String, required: true, trim: true },
    tags: [{ type: String, required: true, trim: true }],
    price: { type: Number, required: true, min: 0 },
    notes: [{ type: String, required: true, trim: true }],
    allergens: { type: String, required: true, trim: true },
    gradient: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type FlavorDocument = InferSchemaType<typeof flavorSchema>;

export const FlavorModel = models.Flavor || model("Flavor", flavorSchema);

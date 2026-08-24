import {
  type InferSchemaType,
  model,
  models,
  Schema,
  type Types,
} from "mongoose";

const quantitiesSchema = new Schema(
  {
    halfLiter: { type: Number, required: true, min: 0 },
    liter: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const adjustmentSchema = new Schema(
  {
    halfLiter: { type: Number, required: true },
    liter: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    adjustedBy: { type: String, required: true, trim: true },
    adjustedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const lotSchema = new Schema(
  {
    flavorId: {
      type: Schema.Types.ObjectId,
      ref: "Flavor",
      required: true,
      index: true,
    },
    packed: { type: quantitiesSchema, required: true },
    remaining: { type: quantitiesSchema, required: true },
    adjustments: { type: [adjustmentSchema], default: () => [] },
    createdBy: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "lots",
  },
);

lotSchema
  .path("packed")
  .validate(
    (value: { halfLiter: number; liter: number }) =>
      value.halfLiter + value.liter > 0,
    "At least one container is required",
  );

lotSchema.index({ flavorId: 1, createdAt: 1 });

export type LotDocument = InferSchemaType<typeof lotSchema> & {
  _id: Types.ObjectId;
};

export const LotModel = models.Lot || model("Lot", lotSchema);

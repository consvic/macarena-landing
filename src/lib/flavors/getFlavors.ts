import { connectToDatabase } from "@/lib/db/mongoose";
import type { Flavor } from "@/lib/types";
import { FlavorModel } from "@/models/Flavor";

export async function getFlavors(): Promise<Flavor[]> {
  await connectToDatabase();

  const flavors = await FlavorModel.find().sort({ createdAt: -1 }).lean();

  return flavors.map((flavor) => ({
    _id: String(flavor._id),
    name: flavor.name,
    description: flavor.description,
    category: flavor.category,
    base: flavor.base,
    intensity: flavor.intensity,
    tags: flavor.tags,
    price: {
      halfLiter: flavor.price.halfLiter,
      liter: flavor.price.liter,
    },
    notes: flavor.notes,
    allergens: flavor.allergens,
    gradient: flavor.gradient,
    coverImage: flavor.coverImage,
  }));
}

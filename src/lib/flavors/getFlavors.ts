import { connectToDatabase } from "@/lib/db/mongoose";
import type { Flavor } from "@/lib/types";
import { FlavorModel } from "@/models/Flavor";

export async function getFlavors(): Promise<Flavor[]> {
  await connectToDatabase();

  const flavors = await FlavorModel.find({
    exists: true,
    isArchived: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .lean();

  return flavors.map((flavor) => ({
    ...flavor,
    _id: String(flavor._id),
    exists: flavor.exists ?? true,
    isVisibleOnSite: flavor.isVisibleOnSite ?? flavor.exists ?? true,
    isArchived: flavor.isArchived ?? false,
  })) as Flavor[];
}

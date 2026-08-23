import { connectToDatabase } from "@/lib/db/mongoose";
import { type Flavor, PRESENTATION_OPTIONS } from "@/lib/types";
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
    availablePresentations: flavor.availablePresentations ?? [
      ...PRESENTATION_OPTIONS,
    ],
    isVisibleOnSite: flavor.isVisibleOnSite ?? flavor.exists ?? true,
    isArchived: flavor.isArchived ?? false,
  })) as Flavor[];
}

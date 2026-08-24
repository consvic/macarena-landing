import { connectToDatabase } from "@/lib/db/mongoose";
import { type Flavor, PRESENTATION_OPTIONS } from "@/lib/types";
import { FlavorModel } from "@/models/Flavor";
import { LotModel } from "@/models/Lot";

export async function getFlavors(): Promise<Flavor[]> {
  await connectToDatabase();

  const flavors = await FlavorModel.find({
    exists: true,
    isArchived: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .lean();

  const managedFlavorIds = flavors
    .filter((flavor) => flavor.inventoryManaged)
    .map((flavor) => flavor._id);
  const lots =
    managedFlavorIds.length > 0
      ? await LotModel.find({ flavorId: { $in: managedFlavorIds } }).lean()
      : [];
  const quantitiesByFlavor = new Map<
    string,
    { halfLiter: number; liter: number }
  >();
  for (const lot of lots) {
    const key = String(lot.flavorId);
    const current = quantitiesByFlavor.get(key) ?? {
      halfLiter: 0,
      liter: 0,
    };
    current.halfLiter += Number(lot.remaining?.halfLiter ?? 0);
    current.liter += Number(lot.remaining?.liter ?? 0);
    quantitiesByFlavor.set(key, current);
  }

  return flavors
    .map((flavor) => {
      const inventoryManaged = Boolean(flavor.inventoryManaged);
      const availableQuantities = inventoryManaged
        ? (quantitiesByFlavor.get(String(flavor._id)) ?? {
            halfLiter: 0,
            liter: 0,
          })
        : undefined;
      const availablePresentations = inventoryManaged
        ? PRESENTATION_OPTIONS.filter((presentation) =>
            presentation === "1/2 litro"
              ? availableQuantities?.halfLiter
              : availableQuantities?.liter,
          )
        : (flavor.availablePresentations ?? [...PRESENTATION_OPTIONS]);

      return {
        ...flavor,
        _id: String(flavor._id),
        exists: flavor.exists ?? true,
        inventoryManaged,
        availableQuantities,
        availablePresentations,
        isVisibleOnSite: flavor.isVisibleOnSite ?? flavor.exists ?? true,
        isArchived: flavor.isArchived ?? false,
      };
    })
    .filter((flavor) => flavor.availablePresentations.length > 0) as Flavor[];
}

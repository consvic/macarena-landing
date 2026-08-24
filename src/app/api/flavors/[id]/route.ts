import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PRESENTATION_OPTIONS } from "@/lib/types";
import { FlavorModel } from "@/models/Flavor";
import { LotModel } from "@/models/Lot";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid flavor id" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const flavor = await FlavorModel.findOne({
      _id: id,
      exists: true,
      isArchived: { $ne: true },
    }).lean();
    if (!flavor) {
      return NextResponse.json(
        { message: "Flavor not found" },
        { status: 404 },
      );
    }

    if (!flavor.inventoryManaged) {
      return NextResponse.json({ ...flavor, inventoryManaged: false });
    }

    const lots = await LotModel.find({ flavorId: flavor._id }).lean();
    const availableQuantities = lots.reduce(
      (totals, lot) => ({
        halfLiter: totals.halfLiter + Number(lot.remaining?.halfLiter ?? 0),
        liter: totals.liter + Number(lot.remaining?.liter ?? 0),
      }),
      { halfLiter: 0, liter: 0 },
    );
    const availablePresentations = PRESENTATION_OPTIONS.filter(
      (presentation) =>
        presentation === "1/2 litro"
          ? availableQuantities.halfLiter > 0
          : availableQuantities.liter > 0,
    );
    if (availablePresentations.length === 0) {
      return NextResponse.json(
        { message: "Flavor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...flavor,
      inventoryManaged: true,
      availableQuantities,
      availablePresentations,
    });
  } catch (error) {
    console.error("[flavors:GET:id]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { FlavorModel } from "@/models/Flavor";

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

    const flavor = await FlavorModel.findOne({ _id: id, exists: true }).lean();
    if (!flavor) {
      return NextResponse.json(
        { message: "Flavor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(flavor);
  } catch (error) {
    console.error("[flavors:GET:id]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

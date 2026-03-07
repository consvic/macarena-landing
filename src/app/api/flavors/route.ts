import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getFlavors } from "@/lib/flavors/getFlavors";
import { FlavorModel } from "@/models/Flavor";

export async function GET() {
  const flavors = await getFlavors();
  return NextResponse.json(flavors);
}

export async function POST(request: Request) {
  await connectToDatabase();

  const payload = await request.json();
  const createdFlavor = await FlavorModel.create(payload);

  return NextResponse.json(createdFlavor.toObject(), { status: 201 });
}

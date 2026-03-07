import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { FlavorModel } from "@/models/Flavor";

export async function GET() {
  await connectToDatabase();

  const flavors = await FlavorModel.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(flavors);
}

export async function POST(request: Request) {
  await connectToDatabase();

  const payload = await request.json();
  const createdFlavor = await FlavorModel.create(payload);

  return NextResponse.json(createdFlavor.toObject(), { status: 201 });
}

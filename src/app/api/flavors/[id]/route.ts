import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { FlavorModel } from "@/models/Flavor";

function invalidIdResponse() {
  return NextResponse.json({ message: "Invalid flavor id" }, { status: 400 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return invalidIdResponse();
  }

  await connectToDatabase();

  const flavor = await FlavorModel.findOne({ _id: id, exists: true }).lean();
  if (!flavor) {
    return NextResponse.json({ message: "Flavor not found" }, { status: 404 });
  }

  return NextResponse.json(flavor);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return invalidIdResponse();
  }

  await connectToDatabase();

  const payload = await request.json();
  const updatedFlavor = await FlavorModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updatedFlavor) {
    return NextResponse.json({ message: "Flavor not found" }, { status: 404 });
  }

  return NextResponse.json(updatedFlavor);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return invalidIdResponse();
  }

  await connectToDatabase();

  const deletedFlavor = await FlavorModel.findByIdAndDelete(id).lean();

  if (!deletedFlavor) {
    return NextResponse.json({ message: "Flavor not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}

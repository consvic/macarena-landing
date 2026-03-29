import { NextResponse } from "next/server";
import { getFlavors } from "@/lib/flavors/getFlavors";

export async function GET() {
  try {
    const flavors = await getFlavors();
    return NextResponse.json(flavors);
  } catch (error) {
    console.error("[flavors:GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

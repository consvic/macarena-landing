import { NextResponse } from "next/server";
import {
  getAuthorizedAdminUserFromRequest,
  unauthorizedJsonResponse,
} from "@/lib/admin/auth";
import {
  importOrdersFromCsv,
  OrderImportValidationError,
} from "@/lib/admin/services";

export async function POST(request: Request) {
  const adminUser = await getAuthorizedAdminUserFromRequest(request);
  if (!adminUser) {
    return unauthorizedJsonResponse();
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || typeof file.text !== "function") {
      return NextResponse.json(
        { message: 'CSV file is required under "file" field' },
        { status: 400 },
      );
    }

    const rawText = await file.text();
    const text = typeof rawText === "string" ? rawText : String(rawText ?? "");
    const result = await importOrdersFromCsv(text, adminUser);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof OrderImportValidationError) {
      return NextResponse.json(
        {
          message: error.message,
          errors: error.errors,
        },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message.includes("empty") || message.includes("header") ? 400 : 500;

    if (status === 500) {
      console.error("[admin:orders:import:POST]", error);
    }

    return NextResponse.json({ message }, { status });
  }
}

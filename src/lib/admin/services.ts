import mongoose from "mongoose";
import {
  assertOrderImportHeaders,
  parseCsv,
  rowToOrderImportObject,
} from "@/lib/admin/csv";
import {
  parseDateOnlyToRangeBoundary,
  parseOrderedAtLocal,
  resolveAdminDateRange,
  toDateInputValue,
} from "@/lib/admin/datetime";
import { connectToDatabase } from "@/lib/db/mongoose";
import {
  FLAVOR_BASES,
  type FlavorBase,
  ORDER_STATUSES,
  type OrderStatus,
  PRESENTATION_OPTIONS,
  type PresentationOption,
} from "@/lib/types";
import { FlavorModel } from "@/models/Flavor";
import { OrderModel } from "@/models/Order";
import { OrderItemModel } from "@/models/OrderItem";

type OrdersQueryInput = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AdminOrder = {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: OrderStatus;
  currency: string;
  totalPrice: number;
  itemCount: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  confirmedAt?: string;
  updatedBy?: string;
  externalOrderId?: string;
};

export type AdminOrdersResponse = {
  data: AdminOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminFlavor = {
  _id: string;
  name: string;
  description: string;
  category: string;
  base: FlavorBase;
  tags: string[];
  price: {
    halfLiter: number;
    liter: number;
  };
  allergens: string;
  gradient: string;
  coverImage: string;
  exists: boolean;
  isVisibleOnSite: boolean;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
};

export type AdminStatsResponse = {
  range: {
    dateFrom: string;
    dateTo: string;
  };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageSpendPerOrder: number;
    averageLitersPerOrder: number;
  };
  topFlavors: Array<{
    flavorName: string;
    quantity: number;
    liters: number;
    revenue: number;
  }>;
  frequentBuyers: Array<{
    buyerKey: string;
    displayName: string;
    orderCount: number;
    totalSpent: number;
    liters: number;
  }>;
  topSpenders: Array<{
    buyerKey: string;
    displayName: string;
    orderCount: number;
    totalSpent: number;
    liters: number;
  }>;
};

export type ImportError = {
  row: number;
  column: string;
  message: string;
};

export class OrderImportValidationError extends Error {
  errors: ImportError[];

  constructor(errors: ImportError[]) {
    super("CSV import validation failed");
    this.name = "OrderImportValidationError";
    this.errors = errors;
  }
}

export type OrdersImportResult = {
  importedOrders: number;
  importedItems: number;
  totalRevenue: number;
};

type MutableFlavorPayload = {
  name?: string;
  description?: string;
  category?: string;
  base?: string;
  tags?: unknown;
  price?: {
    halfLiter?: unknown;
    liter?: unknown;
  };
  allergens?: string;
  gradient?: string;
  coverImage?: string;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function toIsoDate(value: Date | string | undefined) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function mapOrder(order: Record<string, unknown>): AdminOrder {
  return {
    _id: String(order._id),
    customerName: String(order.customerName ?? ""),
    customerEmail: String(order.customerEmail ?? ""),
    customerPhone:
      typeof order.customerPhone === "string" ? order.customerPhone : undefined,
    status: order.status as OrderStatus,
    currency: String(order.currency ?? "MXN"),
    totalPrice: Number(order.totalPrice ?? 0),
    itemCount: Number(order.itemCount ?? 0),
    notes: typeof order.notes === "string" ? order.notes : undefined,
    createdAt: toIsoDate(order.createdAt as Date | string | undefined) ?? "",
    updatedAt: toIsoDate(order.updatedAt as Date | string | undefined),
    confirmedAt: toIsoDate(order.confirmedAt as Date | string | undefined),
    updatedBy:
      typeof order.updatedBy === "string" ? order.updatedBy : undefined,
    externalOrderId:
      typeof order.externalOrderId === "string"
        ? order.externalOrderId
        : undefined,
  };
}

function mapFlavor(flavor: Record<string, unknown>): AdminFlavor {
  const isVisibleOnSite =
    typeof flavor.isVisibleOnSite === "boolean"
      ? flavor.isVisibleOnSite
      : Boolean(flavor.exists ?? true);
  const isArchived = Boolean(flavor.isArchived ?? false);

  return {
    _id: String(flavor._id),
    name: String(flavor.name ?? ""),
    description: String(flavor.description ?? ""),
    category: String(flavor.category ?? ""),
    base: String(flavor.base ?? FLAVOR_BASES[0]) as FlavorBase,
    tags: Array.isArray(flavor.tags)
      ? flavor.tags.map((tag) => String(tag)).filter(Boolean)
      : [],
    price: {
      halfLiter: Number(
        (flavor.price as Record<string, unknown>)?.halfLiter ?? 0,
      ),
      liter: Number((flavor.price as Record<string, unknown>)?.liter ?? 0),
    },
    allergens: String(flavor.allergens ?? ""),
    gradient: String(flavor.gradient ?? ""),
    coverImage: String(flavor.coverImage ?? ""),
    exists: Boolean(flavor.exists ?? isVisibleOnSite),
    isVisibleOnSite,
    isArchived,
    createdAt: toIsoDate(flavor.createdAt as Date | string | undefined),
    updatedAt: toIsoDate(flavor.updatedAt as Date | string | undefined),
    updatedBy:
      typeof flavor.updatedBy === "string" ? flavor.updatedBy : undefined,
  };
}

function parsePagination(input: OrdersQueryInput) {
  const page = Number.isFinite(Number(input.page))
    ? Math.max(1, Number(input.page))
    : 1;
  const limit = Number.isFinite(Number(input.limit))
    ? Math.max(1, Math.min(100, Number(input.limit)))
    : 20;

  return { page, limit };
}

function normalizeBuyerName(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizePhone(value: unknown) {
  return String(value ?? "")
    .replace(/[^\d+]/g, "")
    .trim();
}

function normalizeEmail(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function resolveBuyer(order: Record<string, unknown>) {
  const name = normalizeBuyerName(order.customerName);
  const phone = normalizePhone(order.customerPhone);
  const email = normalizeEmail(order.customerEmail);

  if (name && phone) {
    return {
      key: `name_phone:${name}:${phone}`,
      label: `${String(order.customerName ?? "Cliente")} · ${String(order.customerPhone ?? "")}`,
    };
  }

  if (email) {
    return {
      key: `email:${email}`,
      label: `${String(order.customerName ?? "Cliente")} · ${email}`,
    };
  }

  return {
    key: `order:${String(order._id)}`,
    label: String(order.customerName ?? "Cliente"),
  };
}

function computeItemLiters(quantity: number, presentation: string) {
  const multiplier = presentation === "1 litro" ? 1 : 0.5;
  return quantity * multiplier;
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function parsePrice(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function validateBase(base: string) {
  return FLAVOR_BASES.includes(base as FlavorBase);
}

function parseMutableFlavorPayload(
  payload: MutableFlavorPayload,
  mode: "create" | "update",
) {
  const record: Record<string, unknown> = {};

  if (mode === "create" || payload.name != null) {
    const name = String(payload.name ?? "").trim();
    if (!name) {
      throw new Error("Flavor name is required");
    }
    record.name = name;
  }

  if (mode === "create" || payload.description != null) {
    const description = String(payload.description ?? "").trim();
    if (!description) {
      throw new Error("Flavor description is required");
    }
    record.description = description;
  }

  if (mode === "create" || payload.category != null) {
    const category = String(payload.category ?? "").trim();
    if (!category) {
      throw new Error("Flavor category is required");
    }
    record.category = category;
  }

  if (mode === "create" || payload.base != null) {
    const base = String(payload.base ?? "").trim();
    if (!validateBase(base)) {
      throw new Error("Flavor base is invalid");
    }
    record.base = base;
  }

  if (mode === "create" || payload.tags != null) {
    const tags = parseTags(payload.tags);
    if (tags.length === 0) {
      throw new Error("Flavor tags are required");
    }
    record.tags = tags;
  }

  if (mode === "create" || payload.price != null) {
    const halfLiter = parsePrice(payload.price?.halfLiter);
    const liter = parsePrice(payload.price?.liter);
    if (halfLiter == null || liter == null) {
      throw new Error("Flavor price is invalid");
    }
    record.price = { halfLiter, liter };
  }

  if (mode === "create" || payload.allergens != null) {
    const allergens = String(payload.allergens ?? "").trim();
    if (!allergens) {
      throw new Error("Flavor allergens are required");
    }
    record.allergens = allergens;
  }

  if (mode === "create" || payload.gradient != null) {
    const gradient = String(payload.gradient ?? "").trim();
    if (!gradient) {
      throw new Error("Flavor gradient is required");
    }
    record.gradient = gradient;
  }

  if (mode === "create" || payload.coverImage != null) {
    const coverImage = String(payload.coverImage ?? "").trim();
    if (!coverImage) {
      throw new Error("Flavor cover image is required");
    }
    record.coverImage = coverImage;
  }

  return record;
}

export async function listAdminOrders(
  input: OrdersQueryInput = {},
): Promise<AdminOrdersResponse> {
  await connectToDatabase();

  const { page, limit } = parsePagination(input);
  const query: Record<string, unknown> = {};

  if (
    input.status &&
    ORDER_STATUSES.includes(input.status.trim() as OrderStatus)
  ) {
    query.status = input.status.trim();
  }

  const createdAt: Record<string, Date> = {};
  const dateFrom = parseDateOnlyToRangeBoundary(input.dateFrom ?? "", "start");
  const dateTo = parseDateOnlyToRangeBoundary(input.dateTo ?? "", "end");
  if (dateFrom) {
    createdAt.$gte = dateFrom;
  }
  if (dateTo) {
    createdAt.$lte = dateTo;
  }
  if (Object.keys(createdAt).length > 0) {
    query.createdAt = createdAt;
  }

  const search = String(input.search ?? "").trim();
  if (search) {
    const pattern = new RegExp(
      search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    const searchClauses: Record<string, unknown>[] = [
      { customerName: pattern },
      { customerEmail: pattern },
    ];

    if (isValidObjectId(search)) {
      searchClauses.push({ _id: new mongoose.Types.ObjectId(search) });
    }

    query.$or = searchClauses;
  }

  const total = await OrderModel.countDocuments(query);
  const orders = await OrderModel.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data: orders.map((order) => mapOrder(order as Record<string, unknown>)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function updateAdminOrderStatus(
  id: string,
  status: OrderStatus,
  adminUser: string,
) {
  if (!isValidObjectId(id)) {
    throw new Error("Invalid order id");
  }

  if (!ORDER_STATUSES.includes(status)) {
    throw new Error("Invalid status");
  }

  await connectToDatabase();

  const patch: Record<string, unknown> = {
    status,
    updatedBy: adminUser,
  };

  if (status === "confirmed") {
    patch.confirmedAt = new Date();
  }

  const updated = await OrderModel.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) {
    throw new Error("Order not found");
  }

  return mapOrder(updated as Record<string, unknown>);
}

export async function listAdminFlavors() {
  await connectToDatabase();

  const flavors = await FlavorModel.find({}).sort({ createdAt: -1 }).lean();

  return flavors.map((flavor) => mapFlavor(flavor as Record<string, unknown>));
}

export async function createAdminFlavor(
  payload: MutableFlavorPayload,
  adminUser: string,
) {
  await connectToDatabase();

  const parsed = parseMutableFlavorPayload(payload, "create");

  const created = await FlavorModel.create({
    ...parsed,
    exists: true,
    isVisibleOnSite: true,
    isArchived: false,
    updatedBy: adminUser,
  });

  return mapFlavor(created.toObject() as Record<string, unknown>);
}

export async function updateAdminFlavor(
  id: string,
  payload: MutableFlavorPayload,
  adminUser: string,
) {
  if (!isValidObjectId(id)) {
    throw new Error("Invalid flavor id");
  }

  await connectToDatabase();

  const parsed = parseMutableFlavorPayload(payload, "update");
  if (Object.keys(parsed).length === 0) {
    throw new Error("No changes provided");
  }

  const updated = await FlavorModel.findByIdAndUpdate(
    id,
    {
      ...parsed,
      updatedBy: adminUser,
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!updated) {
    throw new Error("Flavor not found");
  }

  return mapFlavor(updated as Record<string, unknown>);
}

export async function setAdminFlavorVisibility(
  id: string,
  isVisibleOnSite: boolean,
  adminUser: string,
) {
  if (!isValidObjectId(id)) {
    throw new Error("Invalid flavor id");
  }

  await connectToDatabase();

  const current = await FlavorModel.findById(id).lean();
  if (!current) {
    throw new Error("Flavor not found");
  }

  if (Boolean(current.isArchived) && isVisibleOnSite) {
    throw new Error("Archived flavors cannot be visible on site");
  }

  const updated = await FlavorModel.findByIdAndUpdate(
    id,
    {
      isVisibleOnSite,
      exists: isVisibleOnSite,
      updatedBy: adminUser,
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!updated) {
    throw new Error("Flavor not found");
  }

  return mapFlavor(updated as Record<string, unknown>);
}

export async function setAdminFlavorArchived(
  id: string,
  isArchived: boolean,
  adminUser: string,
) {
  if (!isValidObjectId(id)) {
    throw new Error("Invalid flavor id");
  }

  await connectToDatabase();

  const patch = isArchived
    ? {
        isArchived: true,
        isVisibleOnSite: false,
        exists: false,
        updatedBy: adminUser,
      }
    : {
        isArchived: false,
        isVisibleOnSite: false,
        exists: false,
        updatedBy: adminUser,
      };

  const updated = await FlavorModel.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) {
    throw new Error("Flavor not found");
  }

  return mapFlavor(updated as Record<string, unknown>);
}

export async function getAdminStats(input: {
  dateFrom?: string;
  dateTo?: string;
  topN?: number;
}): Promise<AdminStatsResponse> {
  await connectToDatabase();

  const { startDate, endDate } = resolveAdminDateRange(
    input.dateFrom,
    input.dateTo,
    30,
  );
  const topN = Number.isFinite(Number(input.topN))
    ? Math.max(1, Math.min(50, Number(input.topN)))
    : 10;

  const orders = await OrderModel.find({
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .select({
      _id: 1,
      customerName: 1,
      customerEmail: 1,
      customerPhone: 1,
      totalPrice: 1,
      itemCount: 1,
      createdAt: 1,
    })
    .lean();

  const orderIds = orders.map((order) => order._id);

  const orderItems =
    orderIds.length > 0
      ? await OrderItemModel.find({
          orderId: {
            $in: orderIds,
          },
        })
          .select({
            orderId: 1,
            flavorName: 1,
            quantity: 1,
            presentation: 1,
            subtotal: 1,
          })
          .lean()
      : [];

  const litersByOrderId = new Map<string, number>();
  const flavorsMap = new Map<
    string,
    { flavorName: string; quantity: number; liters: number; revenue: number }
  >();

  orderItems.forEach((item) => {
    const orderId = String(item.orderId);
    const quantity = Number(item.quantity ?? 0);
    const liters = computeItemLiters(quantity, String(item.presentation ?? ""));
    const revenue = Number(item.subtotal ?? 0);

    litersByOrderId.set(orderId, (litersByOrderId.get(orderId) ?? 0) + liters);

    const flavorName = String(item.flavorName ?? "Desconocido");
    const existingFlavor = flavorsMap.get(flavorName) ?? {
      flavorName,
      quantity: 0,
      liters: 0,
      revenue: 0,
    };

    existingFlavor.quantity += quantity;
    existingFlavor.liters += liters;
    existingFlavor.revenue += revenue;
    flavorsMap.set(flavorName, existingFlavor);
  });

  const buyersMap = new Map<
    string,
    {
      buyerKey: string;
      displayName: string;
      orderCount: number;
      totalSpent: number;
      liters: number;
    }
  >();

  let totalRevenue = 0;
  let totalLiters = 0;

  orders.forEach((order) => {
    const orderTotal = Number(order.totalPrice ?? 0);
    const orderLiters = litersByOrderId.get(String(order._id)) ?? 0;

    totalRevenue += orderTotal;
    totalLiters += orderLiters;

    const buyer = resolveBuyer(order as Record<string, unknown>);
    const existingBuyer = buyersMap.get(buyer.key) ?? {
      buyerKey: buyer.key,
      displayName: buyer.label,
      orderCount: 0,
      totalSpent: 0,
      liters: 0,
    };

    existingBuyer.orderCount += 1;
    existingBuyer.totalSpent += orderTotal;
    existingBuyer.liters += orderLiters;
    buyersMap.set(buyer.key, existingBuyer);
  });

  const frequentBuyers = Array.from(buyersMap.values())
    .sort((a, b) => {
      if (b.orderCount === a.orderCount) {
        return b.totalSpent - a.totalSpent;
      }

      return b.orderCount - a.orderCount;
    })
    .slice(0, topN);

  const topSpenders = Array.from(buyersMap.values())
    .sort((a, b) => {
      if (b.totalSpent === a.totalSpent) {
        return b.orderCount - a.orderCount;
      }

      return b.totalSpent - a.totalSpent;
    })
    .slice(0, topN);

  const topFlavors = Array.from(flavorsMap.values())
    .sort((a, b) => {
      if (b.quantity === a.quantity) {
        return b.revenue - a.revenue;
      }

      return b.quantity - a.quantity;
    })
    .slice(0, topN);

  const totalOrders = orders.length;

  return {
    range: {
      dateFrom: toDateInputValue(startDate),
      dateTo: toDateInputValue(endDate),
    },
    summary: {
      totalOrders,
      totalRevenue,
      averageSpendPerOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      averageLitersPerOrder: totalOrders > 0 ? totalLiters / totalOrders : 0,
    },
    topFlavors,
    frequentBuyers,
    topSpenders,
  };
}

type ImportedRow = {
  rowNumber: number;
  externalOrderId: string;
  orderedAtRaw: string;
  orderedAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  currency: string;
  notes: string;
  flavorId?: mongoose.Types.ObjectId;
  flavorName: string;
  presentation: PresentationOption;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export async function importOrdersFromCsv(
  csvText: string,
  adminUser: string,
): Promise<OrdersImportResult> {
  await connectToDatabase();

  const { headers, rows } = parseCsv(csvText);
  if (headers.length === 0) {
    throw new Error("CSV file is empty");
  }

  try {
    assertOrderImportHeaders(headers);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Invalid CSV header",
    );
  }

  const parsedRows: ImportedRow[] = [];
  const errors: ImportError[] = [];

  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    if (row.length !== headers.length) {
      errors.push({
        row: rowNumber,
        column: "*",
        message: `Expected ${headers.length} columns but received ${row.length}`,
      });
      return;
    }

    const raw = rowToOrderImportObject(row);

    const externalOrderId = raw.external_order_id.trim();
    if (!externalOrderId) {
      errors.push({
        row: rowNumber,
        column: "external_order_id",
        message: "external_order_id is required",
      });
    }

    const orderedAtRaw = raw.ordered_at.trim();
    const orderedAt = parseOrderedAtLocal(orderedAtRaw);
    if (!orderedAt) {
      errors.push({
        row: rowNumber,
        column: "ordered_at",
        message: "ordered_at must use format YYYY-MM-DD HH:mm",
      });
    }

    const customerName = raw.customer_name.trim();
    if (!customerName) {
      errors.push({
        row: rowNumber,
        column: "customer_name",
        message: "customer_name is required",
      });
    }

    const customerEmail = raw.customer_email.trim().toLowerCase();
    if (!customerEmail) {
      errors.push({
        row: rowNumber,
        column: "customer_email",
        message: "customer_email is required",
      });
    }

    const status = raw.status.trim() as OrderStatus;
    if (!ORDER_STATUSES.includes(status)) {
      errors.push({
        row: rowNumber,
        column: "status",
        message: `status must be one of: ${ORDER_STATUSES.join(", ")}`,
      });
    }

    const currency = raw.currency.trim().toUpperCase();
    if (currency !== "MXN") {
      errors.push({
        row: rowNumber,
        column: "currency",
        message: "currency must be MXN",
      });
    }

    const flavorIdRaw = raw.flavor_id.trim();
    let flavorId: mongoose.Types.ObjectId | undefined;
    if (flavorIdRaw) {
      if (!isValidObjectId(flavorIdRaw)) {
        errors.push({
          row: rowNumber,
          column: "flavor_id",
          message: "flavor_id must be a valid ObjectId",
        });
      } else {
        flavorId = new mongoose.Types.ObjectId(flavorIdRaw);
      }
    }

    const flavorName = raw.flavor_name.trim();
    if (!flavorName) {
      errors.push({
        row: rowNumber,
        column: "flavor_name",
        message: "flavor_name is required",
      });
    }

    const presentation = raw.presentation.trim() as PresentationOption;
    if (!PRESENTATION_OPTIONS.includes(presentation)) {
      errors.push({
        row: rowNumber,
        column: "presentation",
        message: `presentation must be one of: ${PRESENTATION_OPTIONS.join(", ")}`,
      });
    }

    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      errors.push({
        row: rowNumber,
        column: "quantity",
        message: "quantity must be an integer >= 1",
      });
    }

    const unitPrice = Number(raw.unit_price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      errors.push({
        row: rowNumber,
        column: "unit_price",
        message: "unit_price must be a number >= 0",
      });
    }

    if (errors.some((error) => error.row === rowNumber)) {
      return;
    }

    parsedRows.push({
      rowNumber,
      externalOrderId,
      orderedAtRaw,
      orderedAt: orderedAt as Date,
      customerName,
      customerEmail,
      customerPhone: raw.customer_phone.trim(),
      status,
      currency,
      notes: raw.notes.trim(),
      flavorId,
      flavorName,
      presentation,
      quantity,
      unitPrice,
      subtotal: quantity * unitPrice,
    });
  });

  if (errors.length > 0) {
    throw new OrderImportValidationError(errors);
  }

  const grouped = new Map<
    string,
    {
      orderFields: Omit<
        ImportedRow,
        | "flavorId"
        | "flavorName"
        | "presentation"
        | "quantity"
        | "unitPrice"
        | "subtotal"
        | "rowNumber"
      >;
      items: ImportedRow[];
      firstRow: number;
    }
  >();

  parsedRows.forEach((row) => {
    const existing = grouped.get(row.externalOrderId);
    if (!existing) {
      grouped.set(row.externalOrderId, {
        orderFields: {
          externalOrderId: row.externalOrderId,
          orderedAtRaw: row.orderedAtRaw,
          orderedAt: row.orderedAt,
          customerName: row.customerName,
          customerEmail: row.customerEmail,
          customerPhone: row.customerPhone,
          status: row.status,
          currency: row.currency,
          notes: row.notes,
        },
        items: [row],
        firstRow: row.rowNumber,
      });
      return;
    }

    const orderFields = existing.orderFields;
    const mismatchFields: Array<[string, string, string]> = [
      ["ordered_at", orderFields.orderedAtRaw, row.orderedAtRaw],
      ["customer_name", orderFields.customerName, row.customerName],
      ["customer_email", orderFields.customerEmail, row.customerEmail],
      ["customer_phone", orderFields.customerPhone, row.customerPhone],
      ["status", orderFields.status, row.status],
      ["currency", orderFields.currency, row.currency],
      ["notes", orderFields.notes, row.notes],
    ];

    mismatchFields.forEach(([column, previous, current]) => {
      if (previous !== current) {
        errors.push({
          row: row.rowNumber,
          column,
          message:
            "All rows sharing external_order_id must use the same order-level values",
        });
      }
    });

    existing.items.push(row);
  });

  if (errors.length > 0) {
    throw new OrderImportValidationError(errors);
  }

  const externalOrderIds = Array.from(grouped.keys());
  const existingOrders = await OrderModel.find({
    externalOrderId: {
      $in: externalOrderIds,
    },
  })
    .select({ externalOrderId: 1 })
    .lean();

  if (existingOrders.length > 0) {
    const duplicates = new Set(
      existingOrders
        .map((order) => String(order.externalOrderId ?? ""))
        .filter(Boolean),
    );

    duplicates.forEach((duplicateId) => {
      const duplicateGroup = grouped.get(duplicateId);
      if (!duplicateGroup) {
        return;
      }

      errors.push({
        row: duplicateGroup.firstRow,
        column: "external_order_id",
        message: `Order ${duplicateId} has already been imported`,
      });
    });

    throw new OrderImportValidationError(errors);
  }

  let importedOrders = 0;
  let importedItems = 0;
  let totalRevenue = 0;

  for (const [externalOrderId, group] of grouped) {
    const totalPrice = group.items.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const itemCount = group.items.reduce((sum, item) => sum + item.quantity, 0);
    const confirmedAt =
      group.orderFields.status === "confirmed"
        ? group.orderFields.orderedAt
        : undefined;

    const order = await OrderModel.create({
      externalOrderId,
      customerName: group.orderFields.customerName,
      customerEmail: group.orderFields.customerEmail,
      customerPhone: group.orderFields.customerPhone,
      status: group.orderFields.status,
      currency: group.orderFields.currency,
      notes: group.orderFields.notes,
      totalPrice,
      itemCount,
      confirmedAt,
      createdAt: group.orderFields.orderedAt,
      updatedAt: group.orderFields.orderedAt,
      updatedBy: adminUser,
    });

    try {
      await OrderItemModel.insertMany(
        group.items.map((item) => ({
          orderId: order._id,
          flavorId: item.flavorId,
          flavorName: item.flavorName,
          presentation: item.presentation,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          createdAt: group.orderFields.orderedAt,
          updatedAt: group.orderFields.orderedAt,
        })),
      );
    } catch (error) {
      await OrderModel.findByIdAndDelete(order._id);
      throw error;
    }

    importedOrders += 1;
    importedItems += group.items.length;
    totalRevenue += totalPrice;
  }

  return {
    importedOrders,
    importedItems,
    totalRevenue,
  };
}

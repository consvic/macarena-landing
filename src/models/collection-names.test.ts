import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_COLLECTION_NAME,
  AdminSessionModel,
} from "@/models/AdminSession";
import { ADMIN_USER_COLLECTION_NAME, AdminUserModel } from "@/models/AdminUser";
import { ORDER_ITEM_COLLECTION_NAME, OrderItemModel } from "@/models/OrderItem";

describe("MongoDB collection names", () => {
  it("uses explicit hyphenated collection names", () => {
    expect(OrderItemModel.collection.name).toBe(ORDER_ITEM_COLLECTION_NAME);
    expect(AdminUserModel.collection.name).toBe(ADMIN_USER_COLLECTION_NAME);
    expect(AdminSessionModel.collection.name).toBe(
      ADMIN_SESSION_COLLECTION_NAME,
    );
  });
});

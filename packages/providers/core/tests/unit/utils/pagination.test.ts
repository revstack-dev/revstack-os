import { Product } from "@/types/catalog/model";
import { PaginationOptions } from "@/types/shared";
import { buildCursorPagination } from "@/utils/pagination";
import { describe, it, expect } from "vitest";

describe("buildCursorPagination", () => {
  it("builds the correct cursor pagination object", () => {
    const rawData = [
      { id: "prod_1", name: "A" },
      { id: "prod_2", name: "B" },
    ];
    const hasMore = true;
    const options: PaginationOptions = { limit: 10 };

    // Identity mapper for testing
    const mapFn = (item: any) => item as Product;

    const result = buildCursorPagination(rawData, hasMore, options, mapFn);

    expect(result.data).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe("prod_2");
    expect(result.hasPrevious).toBe(false);
    expect(result.previousCursor).toBe("prod_1");
  });

  it("handles previous cursor correctly when startingAfter or cursor is provided", () => {
    const rawData = [{ id: "prod_2", name: "B" }];
    const hasMore = false;
    const options: PaginationOptions = { startingAfter: "prod_1" };

    const mapFn = (item: any) => item as Product;
    const result = buildCursorPagination(rawData, hasMore, options, mapFn);

    expect(result.hasPrevious).toBe(true);
    // previous cursor is the first element of the current page
    expect(result.previousCursor).toBe("prod_2");
  });
});

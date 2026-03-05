import { PaginationOptions, Interval } from "@/types/shared";

export type ProductInput = {
  /** product name */
  name: string;
  /** product description */
  description?: string;
  /** product images */
  images?: string[];
  /** whether the product is active */
  active?: boolean;
  /** custom metadata */
  metadata?: Record<string, any>;
};

export type PriceInput = {
  /** product ID this price belongs to */
  productId: string;
  /** amount in smallest currency unit (e.g., cents) */
  unitAmount: number;
  /** ISO currency code */
  currency: string;
  /** billing interval for recurring prices */
  interval?: Interval;
  /** interval count (e.g., 2 for "every 2 months") */
  intervalCount?: number;
  /** whether the price is active */
  active?: boolean;
  /** custom metadata */
  metadata?: Record<string, any>;
};

export type GetProductInput = { id: string };

export type DeleteProductInput = { id: string };

export type UpdateProductInput = Partial<ProductInput> & { id: string };

export interface ListProductsOptions extends PaginationOptions {
  filters?: Record<string, any>;
}

export type GetPriceInput = { id: string };

export interface ListPricesOptions extends PaginationOptions {
  productId: string;
  filters?: Record<string, any>;
}

import { Interval, PricingType } from "@/types/shared";

export type Product = {
  /** provider external product ID (e.g., `prod_xxx`) */
  id: string;
  /** product name */
  name: string;
  /** product description */
  description?: string;
  /** product images */
  images: string[];
  /** whether the product is active */
  active: boolean;
  /** creation timestamp ISO */
  createdAt: string;
  /** custom metadata */
  metadata?: Record<string, any>;
};

export type Price = {
  /** provider external price ID (e.g., `price_xxx`) */
  id: string;
  /** product ID this price belongs to */
  productId: string;
  /** amount in smallest currency unit */
  unitAmount: number;
  /** ISO currency code */
  currency: string;
  /** "one_time" or "recurring" */
  type: PricingType;
  /** billing interval (only for recurring) */
  interval?: Interval;
  /** interval count */
  intervalCount?: number;
  /** whether the price is active */
  active: boolean;
  /** creation timestamp ISO */
  createdAt: string;
  /** custom metadata */
  metadata?: Record<string, any>;
};

export type CatalogLineItem = {
  /** external price id (e.g., price_1Nxxx) */
  priceId: string;
  /** quantity to purchase */
  quantity: number;
};

export type CustomLineItem = {
  /** item name */
  name: string;
  /** unit amount in cents */
  amount: number;
  /** iso currency (e.g. USD) */
  currency: string;
  /** quantity to purchase */
  quantity: number;

  /** optional item description */
  description?: string;
  /** optional item image urls */
  images?: string[];
  /** recurring interval for subscription line items */
  interval?: Interval;

  /** trial interval for subscription line items */
  trialInterval?: Interval;
  /** trial interval count for subscription line items */
  trialIntervalCount?: number;
};

export type LineItem = CatalogLineItem | CustomLineItem;

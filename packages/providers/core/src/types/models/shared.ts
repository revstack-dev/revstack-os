// =============================================================================
// SHARED TYPES
// =============================================================================

export type Address = {
  /** address line 1 */
  line1: string;
  /** address line 2 */
  line2?: string;
  /** city */
  city: string;
  /** state */
  state?: string;
  /** postal code */
  postalCode: string;
  /** iso country code */
  country: string; // ISO 3166-1 alpha-2
};

export type ActionStatus = "success" | "pending" | "requires_action" | "failed";

export type ProrationBehavior = "create_prorations" | "none" | "always_invoice";

export type AsyncActionResult<T> = {
  /** result data payload */
  data: T | null;
  /** action status */
  status: ActionStatus;
  /** next action required */
  nextAction?: {
    /** next action type */
    type: "redirect" | "url_load" | "show_modal";
    /** action url */
    url?: string;
    /** provider payload */
    payload?: any;
  };
  /** error information */
  error?: {
    /** stable error code */
    code: string;
    /** Human-readable error message. */
    message: string;
    /** provider specific error details */
    providerError?: string;
  };
};

export type PaginationOptions = {
  /** max limit */
  limit?: number;
  /** pagination cursor */
  cursor?: string;
  /** external startingAfter cursor */
  startingAfter?: string;
  /** page number */
  page?: number;
};

export type PaginatedResult<T> = {
  /** page items */
  data: T[];
  /** has more flag */
  hasMore: boolean;
  /** next page cursor */
  nextCursor?: string;
};

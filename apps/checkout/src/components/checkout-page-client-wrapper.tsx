"use client";

import { useGetSession } from "@/hooks/use-get-session";
import { CheckoutPage } from "@/components/checkout-page";

export function CheckoutPageClientWrapper({ token }: { token: string }) {
  const { data, isLoading, error } = useGetSession(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <svg
            className="w-10 h-10 animate-spin text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Loading your checkout...
          </span>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-(--bg-secondary) flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-primary mb-2">
            {error?.message === "Session has expired"
              ? "Checkout session expired"
              : "Session not found"}
          </h1>
          <p className="text-sm text-(--text-muted)">
            {error?.message === "Session has expired"
              ? "This checkout session has expired. Please request a new checkout link from the merchant."
              : "We couldn't find this checkout session. Please verify the link and try again."}
          </p>
        </div>
      </div>
    );
  }

  return <CheckoutPage session={data.data} />;
}

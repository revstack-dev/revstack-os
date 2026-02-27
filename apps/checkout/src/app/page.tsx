import { getCheckoutSession } from "./actions";
import { CheckoutPage } from "@/components/checkout-page";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const token = typeof params.session === "string" ? params.session : undefined;

  if (!token) {
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
              className="text-(--text-muted)"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-(--text-primary) mb-2">
            Invalid checkout link
          </h1>
          <p className="text-sm text-(--text-muted)">
            This checkout link is missing a session token. Please use the link
            provided by the merchant.
          </p>
        </div>
      </div>
    );
  }

  const { data: session, error } = await getCheckoutSession(token);

  if (error || !session) {
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
          <h1 className="text-lg font-semibold text-(--text-primary) mb-2">
            {error === "Session has expired"
              ? "Checkout session expired"
              : "Session not found"}
          </h1>
          <p className="text-sm text-(--text-muted)">
            {error === "Session has expired"
              ? "This checkout session has expired. Please request a new checkout link from the merchant."
              : "We couldn't find this checkout session. Please verify the link and try again."}
          </p>
        </div>
      </div>
    );
  }

  return <CheckoutPage session={session} />;
}

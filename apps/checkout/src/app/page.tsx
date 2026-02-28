import { CheckoutPageClientWrapper } from "@/components/checkout-page-client-wrapper";

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

  return <CheckoutPageClientWrapper token={token} />;
}

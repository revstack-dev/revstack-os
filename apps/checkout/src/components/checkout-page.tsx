"use client";

import type { CheckoutSession } from "@/types";
import { LineItem } from "@/components/line-item";
import { OrderSummary } from "@/components/order-summary";
import { PoweredBy } from "@/components/powered-by";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ArrowRight,
  Clock,
  CreditCard,
  Wallet,
  Bitcoin,
  Package,
  Landmark,
} from "lucide-react";

import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getIconForCategory(category: string) {
  switch (category) {
    case "card":
      return <CreditCard className="w-5 h-5 text-current" />;
    case "wallet":
    case "paypal":
      return <Wallet className="w-5 h-5 text-current" />;
    case "bank_transfer":
      return <Landmark className="w-5 h-5 text-current" />;
    case "crypto":
      return <Bitcoin className="w-5 h-5 text-current" />;
    default:
      return <CreditCard className="w-5 h-5 text-current" />;
  }
}

export function CheckoutPage({ session }: { session: CheckoutSession }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const expires = new Date(session.expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("Expired");
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [session.expiresAt]);

  // Handle theme
  const isDark = session.merchant.theme !== "light"; // default to dark

  // Brand color as CSS variable for tailwind arbitrary values like `hover:border-[currentColor]` or dynamic inline styles
  const brandStyle = {
    "--brand": session.merchant.primaryColor,
  } as React.CSSProperties;

  const mainProducts = session.lineItems.filter(
    (item) => item.type === "product",
  );
  const addons = session.lineItems.filter((item) => item.type === "addon");

  return (
    <div className={isDark ? "dark" : ""}>
      <div
        className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-zinc-50 dark:bg-[#050505] transition-colors font-sans antialiased selection:bg-black/10 dark:selection:bg-white/20"
        style={brandStyle}
      >
        {/*
          If there were any absolute background decorative divs they would go here
          with className="pointer-events-none -z-10" to prevent blocking text selection.
        */}
        <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 animate-in fade-in zoom-in-95 duration-700 ease-out border border-zinc-200 dark:border-white/8 rounded-3xl bg-white dark:bg-[#0A0A0A] shadow-xl dark:shadow-none overflow-hidden mx-auto">
          {/* Left Column: Product Information */}
          <div className="flex flex-col pt-8 lg:pt-10 px-6 lg:px-10 bg-white dark:bg-transparent">
            {/* Merchant Header */}
            <div className="flex items-center gap-4 mb-10">
              {session.merchant.logo ? (
                <img
                  src={session.merchant.logo}
                  alt={session.merchant.name}
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-white/8 bg-white dark:bg-[#111111]"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl border border-zinc-200 dark:border-white/8 bg-white dark:bg-[#111111] flex items-center justify-center text-zinc-900 dark:text-white font-medium text-lg shadow-sm">
                  {session.merchant.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-lg font-medium text-zinc-900 dark:text-white tracking-tight">
                  {session.merchant.name}
                </h1>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-medium text-zinc-900 dark:text-white tracking-tight mb-3">
                Complete your purchase
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                Review your items and continue to secure payment. Your payment
                information is encrypted and secure.
              </p>
            </div>

            <div className="space-y-6 mb-8 flex-1">
              {/* Main Products */}
              {mainProducts.length > 0 && (
                <div className="bg-white dark:bg-white/2 border border-zinc-200 dark:border-white/5 rounded-2xl px-5 py-1 shadow-sm dark:shadow-none">
                  <div className="divide-y divide-zinc-100 dark:divide-white/5">
                    {mainProducts.map((item, i) => (
                      <LineItem key={i} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* Addons Section */}
              {addons.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-(--brand)" />
                    <h3 className="text-xs font-semibold text-(--brand) uppercase tracking-widest">
                      Addons
                    </h3>
                  </div>
                  <div className="flex flex-col gap-3 max-h-40 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full">
                    {addons.map((item, i) => (
                      <div
                        key={i}
                        className="bg-zinc-50 dark:bg-white/2 border border-zinc-200 dark:border-white/5 rounded-xl p-3"
                      >
                        <LineItem item={item} compact />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <OrderSummary totals={session.totals} />
              </div>
            </div>

            {session.merchant.showPoweredBy && (
              <div className="mt-auto pb-8 items-start self-start">
                <PoweredBy />
              </div>
            )}
          </div>

          {/* Right Column: Payment & Actions */}
          <div className="flex flex-col bg-white dark:bg-[#111111] border-l border-zinc-200 dark:border-white/5 relative z-10">
            <div className="flex-1 p-6 lg:p-10">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xl font-medium text-zinc-900 dark:text-white">
                  Payment
                </CardTitle>
                <div
                  className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${
                    isExpired
                      ? "text-red-500 dark:text-red-400 border-red-500/20 bg-red-500/10"
                      : "text-(--brand) border-(--brand)/20 bg-(--brand)/10"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {timeLeft}
                </div>
              </div>
              <CardDescription className="text-zinc-500 dark:text-zinc-400 mb-8">
                Select a securely hosted provider to check out.
              </CardDescription>

              {/* Customer info card if email exists */}
              {session.customerEmail && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 mb-8">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
                      Paying as
                    </span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white tracking-tight">
                      {session.customerEmail}
                    </span>
                  </div>
                  {/* No copy button, sleek and clean */}
                </div>
              )}

              {/* Payment Options List */}
              <div className="flex flex-col gap-3">
                {isExpired ? (
                  <Button
                    disabled
                    className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 flex items-center justify-center text-zinc-500"
                  >
                    Session Expired
                  </Button>
                ) : (
                  session.paymentOptions.map((opt) => (
                    <a
                      key={opt.id}
                      href={opt.action.url}
                      className="group w-full bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 transition-all duration-200 rounded-xl py-4 px-5 flex items-center justify-between shadow-sm dark:shadow-none hover:border-(--brand) dark:hover:border-(--brand) hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-(--brand) transition-colors">
                          {getIconForCategory(opt.category)}
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-white text-sm">
                          {opt.label}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600 group-hover:text-(--brand) transition-colors" />
                    </a>
                  ))
                )}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-4 p-6 lg:px-10 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-transparent">
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 w-full">
                <ShieldCheck className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                <span>Payments are encrypted and safely processed</span>
              </div>

              {session.cancelUrl && !isExpired && (
                <a
                  href={session.cancelUrl}
                  className="text-center text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
                >
                  Cancel and return to store
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

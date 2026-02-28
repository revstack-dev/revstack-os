"use client";

import type { CheckoutSession } from "@/types";
import { LineItem } from "@/components/line-item";
import { OrderSummary } from "@/components/order-summary";
import { PoweredBy } from "@/components/powered-by";
import { ShieldCheck, Clock } from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useCheckoutTimer } from "@/hooks/use-checkout-timer";
import { useCheckoutAddons } from "@/hooks/use-checkout-addons";
import { CheckoutAddons } from "@/components/checkout-addons";
import { CheckoutPaymentMethods } from "@/components/checkout-payment-methods";
import { useCheckoutCoupon } from "@/hooks/use-checkout-coupon";
import { Loader2, Ticket } from "lucide-react";
import React from "react";

export function CheckoutPage({ session }: { session: CheckoutSession }) {
  const { timeLeft, isExpired } = useCheckoutTimer(session.expiresAt);
  const { selectedAddonSlugs, toggleAddon, selectedAddonsArray } =
    useCheckoutAddons(session);
  const {
    couponCode,
    setCouponCode,
    appliedCoupon,
    isApplying,
    error,
    applyCoupon,
    removeCoupon,
  } = useCheckoutCoupon(session);

  // Compute dynamic line items
  const mainProducts = session.items.filter((item) => item.type === "product");

  const activeAddonLineItems = selectedAddonsArray.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    quantity: 1,
    unitAmount: a.unitAmount,
    currency: a.currency,
    type: "addon" as const,
    billingType: a.billingType,
    billing_interval: a.billing_interval,
  }));

  // Compute dynamic totals
  const subtotal = [...mainProducts, ...activeAddonLineItems].reduce(
    (sum, item) => sum + item.unitAmount * item.quantity,
    0,
  );

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percent") {
      discountAmount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else if (appliedCoupon.type === "amount") {
      discountAmount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  const finalTotal = subtotal - discountAmount;

  const currentTotals = {
    subtotal,
    discount: discountAmount,
    total: finalTotal,
    currency: session.totals.currency,
  };

  // Handle theme
  const isDark = session.merchant.theme !== "light"; // default to dark

  // Brand color as CSS variable for tailwind arbitrary values like `hover:border-[currentColor]` or dynamic inline styles
  const brandStyle = {
    "--brand": session.merchant.primaryColor,
  } as React.CSSProperties;

  const currentItemsForSubmit = [...mainProducts, ...activeAddonLineItems];

  return (
    <div className={isDark ? "dark" : ""}>
      <div
        className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-zinc-50 dark:bg-[#050505] transition-colors font-sans antialiased selection:bg-black/10 dark:selection:bg-white/20"
        style={brandStyle}
      >
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
              <CheckoutAddons
                availableAddons={session.availableAddons}
                selectedAddonSlugs={selectedAddonSlugs}
                onToggleAddon={toggleAddon}
              />

              {/* Coupon Section */}
              <div className="pt-4 border-t border-zinc-200 dark:border-white/5">
                {!appliedCoupon ? (
                  <form onSubmit={applyCoupon} className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-300 ml-1">
                      Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          placeholder="e.g. WELCOME20"
                          className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-(--brand)/20 focus:border-(--brand) transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isApplying || !couponCode.trim()}
                        className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors flex items-center justify-center min-w-20"
                      >
                        {isApplying ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                    {error && (
                      <p className="text-xs text-red-500 ml-1 mt-1">{error}</p>
                    )}
                  </form>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-300 ml-1">
                      Applied Coupon
                    </label>
                    <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          {appliedCoupon.code}
                        </span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <OrderSummary totals={currentTotals} />
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
                </div>
              )}

              {/* Payment Options List */}
              <CheckoutPaymentMethods
                session={session}
                options={session.paymentOptions}
                isExpired={isExpired}
                selectedItems={currentItemsForSubmit}
                appliedCoupon={appliedCoupon}
              />
            </div>

            <div className="mt-auto flex flex-col gap-4 p-6 lg:px-10 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-transparent">
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 w-full">
                <ShieldCheck className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
                <span>Payments are encrypted and safely processed</span>
              </div>

              {session.cancelUrl && (
                <Link
                  href={session.cancelUrl}
                  className="text-center text-xs inline mx-auto font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
                >
                  Cancel and return to store
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

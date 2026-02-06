export enum ProviderCategory {
  Card = "card", // Stripe, Adyen, dLocal
  BankTransfer = "bank", // PSE, PIX, Wire, Spei
  Wallet = "wallet", // PayPal, MercadoPago, ApplePay
  Crypto = "crypto", // Coinbase, BitPay
  Cash = "cash", // OXXO, Rapipago, PagoFácil
  BuyNowPayLater = "bnpl", // Klarna, Affirm
}

export const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  [ProviderCategory.Card]: "Credit / Debit Card",
  [ProviderCategory.BankTransfer]: "Bank Transfer",
  [ProviderCategory.Wallet]: "Digital Wallet",
  [ProviderCategory.Crypto]: "Cryptocurrency",
  [ProviderCategory.Cash]: "Cash Payment",
  [ProviderCategory.BuyNowPayLater]: "Buy Now, Pay Later",
};

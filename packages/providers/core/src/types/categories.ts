export enum ProviderCategory {
  Card = "card",
  BankTransfer = "bank",
  Wallet = "wallet",
  Crypto = "crypto",
  Cash = "cash",
  BuyNowPayLater = "bnpl",
  Marketplace = "marketplace",
}

export const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  [ProviderCategory.Card]: "Credit / Debit Card",
  [ProviderCategory.BankTransfer]: "Bank Transfer",
  [ProviderCategory.Wallet]: "Digital Wallet",
  [ProviderCategory.Crypto]: "Cryptocurrency",
  [ProviderCategory.Cash]: "Cash Payment",
  [ProviderCategory.BuyNowPayLater]: "Buy Now, Pay Later",
  [ProviderCategory.Marketplace]: "Marketplace / Digital Goods",
};

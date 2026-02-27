/**
 * ISO 4217 currency codes supported by payment providers.
 * Using a union type for compile-time validation and autocomplete.
 */
export type CurrencyCode =
  // --- Major ---
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CHF"
  | "CNY"
  | "HKD"
  | "SGD"
  | "NZD"
  // --- Latin America ---
  | "BRL"
  | "MXN"
  | "ARS"
  | "CLP"
  | "COP"
  | "PEN"
  | "UYU"
  // --- Europe ---
  | "SEK"
  | "NOK"
  | "DKK"
  | "PLN"
  | "CZK"
  | "HUF"
  | "RON"
  | "BGN"
  | "TRY"
  // --- Asia & Middle East ---
  | "INR"
  | "KRW"
  | "THB"
  | "MYR"
  | "IDR"
  | "PHP"
  | "TWD"
  | "AED"
  | "SAR"
  | "ILS"
  // --- Africa ---
  | "ZAR"
  | "NGN"
  | "KES"
  | "EGP";

/**
 * ISO 3166-1 alpha-2 region codes supported by payment providers.
 * Use "*" to indicate global availability.
 */
export type RegionCode =
  | "*"
  // --- Americas ---
  | "US"
  | "CA"
  | "MX"
  | "BR"
  | "AR"
  | "CL"
  | "CO"
  | "PE"
  | "UY"
  // --- Europe ---
  | "GB"
  | "DE"
  | "FR"
  | "ES"
  | "IT"
  | "NL"
  | "BE"
  | "AT"
  | "CH"
  | "SE"
  | "NO"
  | "DK"
  | "FI"
  | "PL"
  | "CZ"
  | "PT"
  | "IE"
  | "RO"
  | "BG"
  | "HR"
  | "HU"
  // --- Asia & Pacific ---
  | "JP"
  | "CN"
  | "HK"
  | "SG"
  | "AU"
  | "NZ"
  | "IN"
  | "KR"
  | "TH"
  | "MY"
  | "ID"
  | "PH"
  | "TW"
  // --- Middle East ---
  | "AE"
  | "SA"
  | "IL"
  | "TR"
  // --- Africa ---
  | "ZA"
  | "NG"
  | "KE"
  | "EG";

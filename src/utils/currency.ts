/**
 * Realistic foreign exchange rates table relative to USD (1.0 baseline)
 * Values represent units of local currency per 1.0 USD.
 */
export const CURRENCY_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  CHF: 0.88,
  CAD: 1.36,
  AUD: 1.52,
  NZD: 1.64,
  JPY: 152.0,
  KRW: 1350.0,
  CNY: 7.15,
  TWD: 32.0,
  SGD: 1.32,
  HKD: 7.78,
  INR: 84.0,
  PHP: 58.0,
  IDR: 15600.0,
  VND: 25000.0,
  THB: 34.5,
  MYR: 4.35,
  BND: 1.32,
  FJD: 2.25,
  MXN: 19.5,
  BRL: 5.6,
  ARS: 980.0,
  CLP: 940.0,
  COP: 4200.0,
  PEN: 3.75,
  CRC: 515.0,
  JMD: 157.0,
  BSD: 1.0,
  CUP: 24.0,
  SAR: 3.75,
  AED: 3.67,
  QAR: 3.64,
  KWD: 0.31, // Highest value currency in the world (1 KWD = ~$3.23 USD)
  BHD: 0.38,
  JOD: 0.71,
  MAD: 9.85,
  TRY: 34.2,
  ILS: 3.75,
  EGP: 48.5,
  ZAR: 17.5,
  NGN: 1650.0,
  KES: 129.0,
  SEK: 10.5,
  NOK: 10.8,
  DKK: 6.85,
  ISK: 138.0,
  PLN: 3.95,
  CZK: 23.2,
  HUF: 365.0,
  RON: 4.58,
  UAH: 41.5,
};

/**
 * Returns the exchange multiplier from fromCurrency to toCurrency.
 * E.g. USD to JPY returns 152.
 * E.g. JPY to USD returns 1/152 (~0.00657).
 */
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  const fromRate = CURRENCY_RATES_TO_USD[fromCurrency] || 1.0;
  const toRate = CURRENCY_RATES_TO_USD[toCurrency] || 1.0;
  return toRate / fromRate;
}

/**
 * Converts an amount from one currency to another using the exchange rate.
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  const rate = getExchangeRate(fromCurrency, toCurrency);
  return Math.max(0, Math.round(amount * rate));
}

/**
 * Formats exchange rate display string
 * e.g. "1 USD = 152.00 JPY" or "1 KWD = 3.23 USD"
 */
export function formatRateDisplay(fromCurrency: string, toCurrency: string): string {
  const rate = getExchangeRate(fromCurrency, toCurrency);
  if (rate >= 1) {
    return `1 ${fromCurrency} = ${rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${toCurrency}`;
  } else {
    const inverted = 1 / rate;
    return `1 ${toCurrency} = ${inverted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${fromCurrency}`;
  }
}

export const CURRENCY_OPTIONS = [
  { code: 'ZAR', name: 'South African rand' },
  { code: 'USD', name: 'US dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British pound' },
  { code: 'NGN', name: 'Nigerian naira' },
  { code: 'KES', name: 'Kenyan shilling' },
  { code: 'BWP', name: 'Botswana pula' },
];

const LOCALE_BY_CURRENCY = {
  ZAR: 'en-ZA',
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
  NGN: 'en-NG',
  KES: 'en-KE',
  BWP: 'en-BW',
};

const formatters = new Map();

function formatter(currency, fractionDigits) {
  const key = `${currency}:${fractionDigits}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency] ?? 'en-ZA', {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatters.set(key, cached);
  }
  return cached;
}

/** Whole amounts without cents ("R1 200"), otherwise two decimals. Plain spaces keep USSD text short. */
export function formatMoney(cents, currency) {
  return formatter(currency, cents % 100 === 0 ? 0 : 2)
    .format(cents / 100)
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/^(-?[^\d\s-]+) (?=\d)/, '$1');
}

/**
 * Parses what people type: "1 234,56", "1,234.56", "R1234" or "1234.5". The last "." or ","
 * counts as the decimal separator only when one or two digits follow it. USSD keypads have no
 * decimal point, so "*" works as one too.
 */
export function parseMoney(input) {
  const cleaned = input.replace(/\*/g, '.').replace(/[^\d.,]/g, '');
  if (!cleaned) return null;

  const separator = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','));
  const hasDecimals = separator >= 0 && cleaned.length - separator - 1 <= 2;
  const whole = (hasDecimals ? cleaned.slice(0, separator) : cleaned).replace(/[.,]/g, '');
  const fraction = hasDecimals ? cleaned.slice(separator + 1).padEnd(2, '0') : '00';

  const cents = Number(whole || '0') * 100 + Number(fraction);
  return Number.isFinite(cents) ? cents : null;
}

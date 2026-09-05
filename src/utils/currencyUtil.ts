import { INVALID_CURRENCY_FORMAT } from "@/constants/constants";

export const clearDecimal = (amount: string): string =>
  amount.trim().replaceAll(",", "");

function validateCurrencyString(amount: string): void {
  const trimmed = amount.trim();

  const commaPattern = /^-?\d+(,\d{3})*(\.\d{1,2})?$/;
  if (!commaPattern.test(trimmed)) {
    throw new Error(INVALID_CURRENCY_FORMAT);
  }

  const cleaned = clearDecimal(trimmed);
  const numberPattern = /^-?[0-9]+(\.[0-9]{1,2})?$/;
  if (!numberPattern.test(cleaned)) {
    throw new Error(INVALID_CURRENCY_FORMAT);
  }
}

function stringToCents(amount: string): number {
  const original = amount.trim();
  validateCurrencyString(original);

  const value = clearDecimal(original);

  const parts = value.split(".");
  const integerPart = parts[0] || "0";
  const decimalPart = parts[1] || "";

  const decimal = decimalPart.padEnd(2, "0");

  return Number(integerPart + decimal);
}

export function decimalSum(amount1: string, amount2: string): string {
  const cents1 = stringToCents(amount1);
  const cents2 = stringToCents(amount2);
  const sum = cents1 + cents2;
  return (sum / 100).toFixed(2);
}

export function decimalMultiply(amount: string, multiplier: string): string {
  const cents = stringToCents(amount);
  const multiplierCents = stringToCents(multiplier);
  const product = cents * multiplierCents;
  return (product / 10000).toFixed(2);
}

function divideWithPrecision(
  numerator: number,
  denominator: number,
  decimals: number = 16
): string {
  if (denominator === 0) throw new Error("Division by zero is not allowed.");

  const num = BigInt(numerator);
  const den = BigInt(denominator);
  const factor = BigInt(10 ** decimals);

  const scaled = (num * factor) / den;

  const str = scaled.toString().padStart(decimals + 1, "0");
  const intPart = str.slice(0, -decimals);
  const fracPart = str.slice(-decimals);

  const trimmedFrac = fracPart.replace(/0+$/, "");
  return trimmedFrac === "" ? intPart : `${intPart}.${trimmedFrac}`;
}

export function decimalDivide(amount: string, divisor: string): string {
  const cents = stringToCents(amount);
  const divisorCents = stringToCents(divisor);
  if (divisorCents === 0) throw new Error("Division by zero is not allowed.");
  return divideWithPrecision(cents, divisorCents);
}

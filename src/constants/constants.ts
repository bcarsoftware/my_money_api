import "dotenv/config";

export const __prod__ = process.env.NODE_ENV === "production";
export const __prodLike__ = __prod__ || process.env.NODE_ENV === "staging";

export const TOKEN_INVALID = "Token invalid.";

export const SECRET_KEY_INVALID = "Secret key invalid.";

export const USER_NOT_FOUND = "User not found.";
export const USER_NOT_AUTHENTICATED = "User not authenticated.";
export const USER_PASSWORD_NOT_MATCH = "User password not match.";
export const USER_BANK_NOT_MATCH = "User bank not match.";
export const USER_NOT_AUTHORIZED = "User not authorized.";

export const SALT_ROUNDS_INVALID = "Salt rounds invalid.";

export const INVOICE_NOT_FOUND = "Invoice not found.";

export const CREDIT_LIMIT_EXCEEDED = "Credit limit exceeded.";

export const INVALID_CURRENCY_FORMAT =
  "Invalid currency format. Must be a number with up to 2 decimal places.";
export const INVALID_DAY_MONTH_COMBINATION =
  "Invalid day and month combination.";

export const PAYMENT_NOT_FOUND = "Payment not found.";

export const GENERIC_BANK_NOT_FOUND = "Generic bank not found.";

export const GENERIC_BANK_BOX_NOT_FOUND = "Generic bank box not found.";

export const BANK_BOX_NOT_FOUND = "Bank box not found.";

export const START_DATE_AFTER_END_DATE = "Start date cannot be after end date.";
export const MIN_AMOUNT_GREATER_THAN_MAX_AMOUNT = "Min amount cannot be greater than max amount.";

export const BALANCE_INVALID = "Balance is not a valid currency.";

export const INSUFFICIENT_BALANCE = "Insufficient balance.";

import "dotenv/config";

export const __prod__ = process.env.NODE_ENV === "production";
export const __prodLike__ = __prod__ || process.env.NODE_ENV === "staging";

export const TOKEN_INVALID = "Token invalid.";

export const SECRET_KEY_INVALID = "Secret key invalid.";

export const USER_NOT_FOUND = "User not found.";
export const USER_NOT_AUTHENTICATED = "User not authenticated.";
export const USER_PASSWORD_NOT_MATCH = "User password not match.";
export const USER_BANK_NOT_MATCH = "User bank not match.";

export const SALT_ROUNDS_INVALID = "Salt rounds invalid.";

export const INVOICE_NOT_FOUND = "Invoice not found.";

export const INVALID_CURRENCY_FORMAT =
  "Invalid currency format. Must be a number with up to 2 decimal places.";
export const INVALID_DAY_MONTH_COMBINATION = "Invalid day and month combination.";

export const PAYMENT_NOT_FOUND = "Payment not found.";

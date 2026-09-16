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

export const BANK_NOT_FOUND = "Bank not found.";

export const BANK_BOX_NOT_FOUND = "Bank box not found.";

export const START_DATE_AFTER_END_DATE = "Start date cannot be after end date.";
export const MIN_AMOUNT_GREATER_THAN_MAX_AMOUNT =
  "Min amount cannot be greater than max amount.";

export const BALANCE_INVALID = "Balance is not a valid currency.";

export const INSUFFICIENT_BALANCE = "Insufficient balance.";

export const OPERATION_NOT_FOUND = "Operation not found.";
export const OPERATION_TYPE_INVALID = "Operation type invalid.";

export const OPERATION_BANK_INVALID_BALANCE_TO_BANK_BOX =
  "Invalid balance for bank to bank box operation.";

export const GENERIC_BANK_BOX_REQUIRED = "Generic bank box is required.";

export const BALANCE_MUST_BE_POSITIVE = "Balance must be greater than 0.";

export const FROM_BANK_ID_MUST_OMITTED_EXTERNAL =
  "From bank ID must be omitted for external transfers.";
export const TO_BANK_ID_REQUIRED =
  "To bank ID must be provided for internal transfers.";

export const FROM_GENERIC_BANK_ID_MUST_OMITTED_EXTERNAL =
  "From generic bank ID must be omitted for external transfers.";
export const TO_GENERIC_BANK_ID_REQUIRED =
  "To generic bank ID must be provided for internal transfers.";

export const MONEY_NOT_FOUND = "Money not found.";

export const AMOUNT_INVALID_FOR_SEND = "Amount invalid for SEND operation.";

export const AMOUNT_INVALID_FOR_RECEIVE =
  "Amount invalid for RECEIVE operation.";

export const TO_MONEY_ID_OMITTED_FOR_EXTERNAL =
  "To money ID must be omitted for external transfers.";

import "dotenv/config";

export const __prod__ = process.env.NODE_ENV === "production";
export const __prodLike__ = __prod__ || process.env.NODE_ENV === "staging";

export const TOKEN_INVALID = "token invalid.";

export const SECRET_KEY_INVALID = "secret key invalid.";

export const USER_NOT_FOUND = "user not found.";
export const USER_NOT_AUTHENTICATED = "user not authenticated.";
export const USER_PASSWORD_NOT_MATCH = "user password not match.";
export const USER_BANK_NOT_MATCH = "user bank not match.";

export const SALT_ROUNDS_INVALID = "salt rounds invalid.";

export const INVOICE_NOT_FOUND = "invoice not found.";

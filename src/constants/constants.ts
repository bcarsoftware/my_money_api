import "dotenv/config";

export const __prod__ = process.env.NODE_ENV === "production";
export const __prodLike__ = __prod__ || process.env.NODE_ENV === "staging";

export const TOKEN_INVALID = "token invalid";

export const SECRET_KEY_INVALID = "secret key invalid";

export const USER_NOT_FOUND = "user not found";

import { SECRET_KEY_INVALID } from "@/constants/constants";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  username: string;
}

function checkPattern(value?: string): boolean {
  if (!value || typeof value !== "string") return false;

  const regex =
    /^-?\d+\s*(?:ms|s(?:ec(?:ond)?s?)?|m(?:in(?:ute)?s?)?|h(?:r|our)?s?|d(?:ays?)?|w(?:eeks?)?|y(?:ears?)?)$/;

  return regex.test(value);
}

export function generateAccessToken(payload: TokenPayload): string {
  const expiresIn = process.env.EXPIRES_IN;

  if (!checkPattern(expiresIn)) {
    throw new Error(
      "Invalid expiration time format. It should be a number or a string with a valid time unit."
    );
  }

  const secret = process.env.ACCESS_SECRET;

  if (!secret || typeof secret !== "string") {
    throw new Error(SECRET_KEY_INVALID);
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid token payload");
  }

  if (!payload.userId || typeof payload.userId !== "string") {
    throw new Error("Invalid token payload: userId is required");
  }

  if (!payload.email || typeof payload.email !== "string") {
    throw new Error("Invalid token payload: email is required");
  }

  if (!payload.username || typeof payload.username !== "string") {
    throw new Error("Invalid token payload: username is required");
  }

  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
}

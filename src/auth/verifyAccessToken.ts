import jwt, { JwtPayload } from "jsonwebtoken";
import { SECRET_KEY_INVALID, TOKEN_INVALID } from "@/constants/constants";

export interface TokenPayload extends JwtPayload {
  userId: string;
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const secret = process.env.ACCESS_SECRET;

  if (!secret) throw new Error(SECRET_KEY_INVALID);

  if (!token || typeof token !== "string") throw new Error(TOKEN_INVALID);

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;

    if (!decoded || typeof decoded !== "object" || !decoded.userId) {
      throw new Error(TOKEN_INVALID);
    }

    return decoded;
  } catch (error) {
    throw new Error(TOKEN_INVALID);
  }
}

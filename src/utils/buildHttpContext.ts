import { verifyAccessToken } from "@/auth/verifyAccessToken";
import { Request, Response } from "express";
import { MyContext } from "../context/MyContext";
import { accessCookieName } from "./cookiesUtil";

export async function buildHttpContext(
  req: Request,
  res: Response
): Promise<MyContext> {
  const cookies = req.cookies as Record<string, string> | undefined;
  const token = cookies?.[accessCookieName()] ?? "token";

  const claims = await verifyAccessToken(token);

  return {
    req,
    res,
    ...(claims ? { accessToken: token } : {}),
  };
}

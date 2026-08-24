import { verifyAccessToken } from "@/auth/verifyAccessToken";
import { Request, Response } from "express";
import { MyContext } from "@/context/MyContext";
import { accessCookieName } from "@/utils/cookiesUtil";

export async function buildHttpContext(
  req: Request,
  res: Response
): Promise<MyContext> {
  const cookies = req.cookies as Record<string, string> | undefined;
  const token = cookies?.[accessCookieName()];

  return {
    req,
    res,
    ...(token ? { accessToken: token } : {}),
  };
}

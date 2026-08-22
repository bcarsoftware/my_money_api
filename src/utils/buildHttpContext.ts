import { Request, Response } from "express";
import { MyContext } from "./MyContext";
import { accessCookieName } from "./cookiesUtil";

export async function buildHttpContext(
  req: Request,
  res: Response
): Promise<MyContext> {
  const cookies = req.cookies as Record<string, string> | undefined;
  const token = cookies?.[accessCookieName()] ?? "token";

  // TODO: create a function to verify the token and return claims, instead of using a dummy value
  const claims = (() => "token")();

  return {
    req,
    res,
    ...(claims ? { accessToken: token } : {}),
  };
}

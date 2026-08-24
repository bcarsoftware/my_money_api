import { MiddlewareFn, UseMiddleware } from "type-graphql";
import { MyContext } from "@/context/MyContext";
import { verifyAccessToken } from "@/auth/verifyAccessToken";
import { accessCookieName } from "@/utils/cookiesUtil";

export const authMiddleware: MiddlewareFn<MyContext> = async (
  { context },
  next
) => {
  const token =
    context.accessToken ||
    (context.req.cookies as Record<string, string> | undefined)?.[
      accessCookieName()
    ];

  if (!token) {
    throw new Error("Access denied. No token provided.");
  }

  const claims = await verifyAccessToken(token);

  if (!claims) {
    throw new Error("Access denied. Invalid or expired token.");
  }

  return next();
};

export function Authorized(): MethodDecorator & PropertyDecorator {
  return UseMiddleware(authMiddleware);
}

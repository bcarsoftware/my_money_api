import { verifyAccessToken } from "@/auth/verifyAccessToken";
import { TOKEN_INVALID } from "@/constants/constants";
import { MyContext } from "@/context/MyContext";
import { accessCookieName } from "@/utils/cookiesUtil";
import { MiddlewareFn, UseMiddleware } from "type-graphql";

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
    throw new Error(TOKEN_INVALID);
  }

  const claims = await verifyAccessToken(token);

  if (!claims) {
    throw new Error(TOKEN_INVALID);
  }

  return next();
};

export function Authorized(): MethodDecorator & PropertyDecorator {
  return UseMiddleware(authMiddleware);
}

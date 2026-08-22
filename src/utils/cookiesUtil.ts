import {
  __prodLike__,
  TOKEN_INVALID,
  USER_NOT_FOUND,
} from "@/constants/constants";
import { User } from "@/entities/User";
import { MyContext } from "./MyContext";

export interface AuthUserData {
  id: string;
  name: string;
  email: string;
  username: string;
}

export const ACCESS_COOKIE = "accessToken";

export const accessCookieName = () => ACCESS_COOKIE;

export const baseCookieOpts = {
  httpOnly: true,
  secure: __prodLike__,
  sameSite: "strict" as const,
  path: "/",
};

export function setAccessCookie(
  res: MyContext["res"],
  token: string,
  expiresIn: number
) {
  res!.cookie(accessCookieName(), token, {
    ...baseCookieOpts,
    maxAge: expiresIn * 1000,
  });
}

export function clearCookies(res: MyContext["res"]) {
  res!.clearCookie(accessCookieName(), baseCookieOpts);
}

export async function buildAuthUser(user: User): Promise<AuthUserData> {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
  };
}

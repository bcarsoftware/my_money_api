import {
  ACCESS_COOKIE,
  accessCookieName,
  baseCookieOpts,
  setAccessCookie,
  clearCookies,
  buildAuthUser,
  AuthUserData,
} from "@/utils/cookiesUtil";
import { User } from "@/entities/User";
import { MyContext } from "@/utils/MyContext";

describe("Auth Utilities & Cookie Helpers", () => {
  let mockRes: {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
  };

  beforeEach(() => {
    mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  describe("accessCookieName", () => {
    it("deve retornar o nome correto da constante do cookie", () => {
      const result = accessCookieName();

      expect(result).toBe("accessToken");
      expect(result).toBe(ACCESS_COOKIE);
    });
  });

  describe("setAccessCookie", () => {
    it("deve definir o cookie com nome, token e opções corretas incluindo maxAge em milissegundos", () => {
      const token = "mock-jwt-token-xyz";
      const expiresInSeconds = 3600; // 1 hora

      setAccessCookie(
        mockRes as unknown as MyContext["res"],
        token,
        expiresInSeconds
      );

      expect(mockRes.cookie).toHaveBeenCalledTimes(1);
      expect(mockRes.cookie).toHaveBeenCalledWith(ACCESS_COOKIE, token, {
        ...baseCookieOpts,
        maxAge: 3600000, // 3600 * 1000
      });
    });

    it("deve calcular maxAge corretamente para tempo zero ou fracionado", () => {
      const token = "short-token";
      const expiresInSeconds = 0.5;

      setAccessCookie(
        mockRes as unknown as MyContext["res"],
        token,
        expiresInSeconds
      );

      expect(mockRes.cookie).toHaveBeenCalledWith(
        ACCESS_COOKIE,
        token,
        expect.objectContaining({
          maxAge: 500,
        })
      );
    });
  });

  describe("clearCookies", () => {
    it("deve limpar o cookie de acesso com as opções base", () => {
      clearCookies(mockRes as unknown as MyContext["res"]);

      expect(mockRes.clearCookie).toHaveBeenCalledTimes(1);
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        ACCESS_COOKIE,
        baseCookieOpts
      );
    });
  });

  describe("buildAuthUser", () => {
    it("deve mapear e sanitizar a entidade User retornando apenas o payload de AuthUserData", async () => {
      const mockUser = {
        id: "user-uuid-123",
        name: "Abel Carvalho",
        email: "abel@example.com",
        username: "abelcarvalho",
        password: "hashed_sensitive_password",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as User;

      const result: AuthUserData = await buildAuthUser(mockUser);

      expect(result).toEqual({
        id: "user-uuid-123",
        name: "Abel Carvalho",
        email: "abel@example.com",
        username: "abelcarvalho",
      });
      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("createdAt");
    });
  });
});

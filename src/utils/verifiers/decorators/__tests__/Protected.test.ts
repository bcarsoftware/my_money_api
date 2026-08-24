import { verifyAccessToken } from "@/auth/verifyAccessToken";
import { TOKEN_INVALID } from "@/constants/constants";
import { MyContext } from "@/context/MyContext";
import { accessCookieName } from "@/utils/cookiesUtil";
import {
  authMiddleware,
  Protected,
} from "@/utils/verifiers/decorators/Protected";
import { Request, Response } from "express";
import "reflect-metadata";
import { ResolverData, UseMiddleware } from "type-graphql";

jest.mock("@/auth/verifyAccessToken");
jest.mock("@/utils/cookiesUtil");
jest.mock("type-graphql", () => {
  const original = jest.requireActual("type-graphql");
  return {
    ...original,
    UseMiddleware: jest.fn().mockImplementation((mw) => mw),
  };
});

describe("Protected Decorator & authMiddleware", () => {
  let mockContext: MyContext;
  let mockNext: jest.Mock;
  const mockCookieName = "accessToken";
  const mockToken = "valid.jwt.token";
  const mockClaims = {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    username: "abelcarvalho",
    email: "abel@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (accessCookieName as jest.Mock).mockReturnValue(mockCookieName);

    mockContext = {
      req: { cookies: {} } as unknown as Request,
      res: {} as Response,
    };

    mockNext = jest.fn().mockResolvedValue("target_resolver_result");
  });

  describe("authMiddleware", () => {
    it("deve autenticar e prosseguir quando o token estiver presente em context.accessToken", async () => {
      mockContext.accessToken = mockToken;
      (verifyAccessToken as jest.Mock).mockResolvedValue(mockClaims);

      const resolverData = {
        context: mockContext,
      } as ResolverData<MyContext>;

      const result = await authMiddleware(resolverData, mockNext);

      expect(verifyAccessToken).toHaveBeenCalledWith(mockToken);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(result).toBe("target_resolver_result");
    });

    it("deve extrair o token de req.cookies quando context.accessToken for undefined", async () => {
      mockContext.req = {
        cookies: { [mockCookieName]: mockToken },
      } as unknown as Request;

      (verifyAccessToken as jest.Mock).mockResolvedValue(mockClaims);

      const resolverData = {
        context: mockContext,
      } as ResolverData<MyContext>;

      const result = await authMiddleware(resolverData, mockNext);

      expect(accessCookieName).toHaveBeenCalledTimes(1);
      expect(verifyAccessToken).toHaveBeenCalledWith(mockToken);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(result).toBe("target_resolver_result");
    });

    it("deve lançar erro se nenhum token for fornecido", async () => {
      const resolverData = {
        context: mockContext,
      } as ResolverData<MyContext>;

      await expect(authMiddleware(resolverData, mockNext)).rejects.toThrow(
        TOKEN_INVALID
      );

      expect(verifyAccessToken).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve lançar erro se req.cookies for undefined e não houver accessToken", async () => {
      mockContext.req = {} as Request;

      const resolverData = {
        context: mockContext,
      } as ResolverData<MyContext>;

      await expect(authMiddleware(resolverData, mockNext)).rejects.toThrow(
        TOKEN_INVALID
      );

      expect(verifyAccessToken).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve lançar erro de token inválido se verifyAccessToken retornar null ou undefined", async () => {
      mockContext.accessToken = mockToken;
      (verifyAccessToken as jest.Mock).mockResolvedValue(null);

      const resolverData = {
        context: mockContext,
      } as ResolverData<MyContext>;

      await expect(authMiddleware(resolverData, mockNext)).rejects.toThrow(
        TOKEN_INVALID
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve propagar a exceção lançada por verifyAccessToken", async () => {
      mockContext.accessToken = "corrupted.jwt.token";
      const jwtError = new Error("jwt malformed");
      (verifyAccessToken as jest.Mock).mockRejectedValue(jwtError);

      const resolverData = {
        context: mockContext,
      } as ResolverData<MyContext>;

      await expect(authMiddleware(resolverData, mockNext)).rejects.toThrow(
        jwtError
      );

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Protected decorator factory", () => {
    it("deve invocar UseMiddleware repassando authMiddleware", () => {
      Protected();

      expect(UseMiddleware).toHaveBeenCalledWith(authMiddleware);
    });
  });
});

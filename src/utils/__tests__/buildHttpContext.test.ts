import { verifyAccessToken } from "@/auth/verifyAccessToken";
import { buildHttpContext } from "@/utils/buildHttpContext";
import { accessCookieName } from "@/utils/cookiesUtil";
import { Request, Response } from "express";

jest.mock("@/utils/cookiesUtil");

describe("buildHttpContext", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  const mockCookieName = "accessToken";
  const mockValidToken = "valid.jwt.token";
  const mockClaims = {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    email: "abel@example.com",
    username: "abelcarvalho",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (accessCookieName as jest.Mock).mockReturnValue(mockCookieName);

    mockReq = {
      cookies: {},
    };

    mockRes = {};
  });

  describe("Cenários de Sucesso", () => {
    it("deve extrair o token dos cookies, verificar com sucesso e incluir accessToken no contexto", async () => {
      mockReq.cookies = { [mockCookieName]: mockValidToken };

      const context = await buildHttpContext(
        mockReq as Request,
        mockRes as Response
      );

      expect(accessCookieName).toHaveBeenCalledTimes(1);
      expect(context).toEqual({
        req: mockReq,
        res: mockRes,
        accessToken: mockValidToken,
      });
    });

    it("deve usar undefined quando o cookie correspondente não estiver presente", async () => {
      mockReq.cookies = {};

      const context = await buildHttpContext(
        mockReq as Request,
        mockRes as Response
      );

      expect(context).toEqual({
        req: mockReq,
        res: mockRes,
        accessToken: undefined,
      });
    });
  });
});

import { Request, Response } from "express";
import { buildHttpContext } from "@/utils/buildHttpContext";
import { accessCookieName } from "@/utils/cookiesUtil";
import { verifyAccessToken } from "@/auth/verifyAccessToken";
import { TOKEN_INVALID } from "@/constants/constants";

jest.mock("@/utils/cookiesUtil");
jest.mock("@/auth/verifyAccessToken");

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
      (verifyAccessToken as jest.Mock).mockResolvedValue(mockClaims);

      const context = await buildHttpContext(
        mockReq as Request,
        mockRes as Response
      );

      expect(accessCookieName).toHaveBeenCalledTimes(1);
      expect(verifyAccessToken).toHaveBeenCalledWith(mockValidToken);
      expect(context).toEqual({
        req: mockReq,
        res: mockRes,
        accessToken: mockValidToken,
      });
    });

    it("deve usar a string 'token' como fallback quando o cookie correspondente não estiver presente", async () => {
      mockReq.cookies = {}; // cookie vazio
      (verifyAccessToken as jest.Mock).mockResolvedValue(mockClaims);

      const context = await buildHttpContext(
        mockReq as Request,
        mockRes as Response
      );

      expect(verifyAccessToken).toHaveBeenCalledWith("token");
      expect(context).toEqual({
        req: mockReq,
        res: mockRes,
        accessToken: "token",
      });
    });

    it("deve usar a string 'token' como fallback quando req.cookies for undefined", async () => {
      mockReq.cookies = undefined;
      (verifyAccessToken as jest.Mock).mockResolvedValue(mockClaims);

      const context = await buildHttpContext(
        mockReq as Request,
        mockRes as Response
      );

      expect(verifyAccessToken).toHaveBeenCalledWith("token");
      expect(context).toEqual({
        req: mockReq,
        res: mockRes,
        accessToken: "token",
      });
    });

    it("não deve incluir accessToken no contexto se verifyAccessToken retornar falsy (null/undefined)", async () => {
      mockReq.cookies = { [mockCookieName]: mockValidToken };
      (verifyAccessToken as jest.Mock).mockResolvedValue(null);

      const context = await buildHttpContext(
        mockReq as Request,
        mockRes as Response
      );

      expect(verifyAccessToken).toHaveBeenCalledWith(mockValidToken);
      expect(context).toEqual({
        req: mockReq,
        res: mockRes,
      });
      expect(context).not.toHaveProperty("accessToken");
    });
  });

  describe("Propagação de Erros", () => {
    it("deve propagar a exceção se verifyAccessToken lançar erro de token inválido", async () => {
      mockReq.cookies = { [mockCookieName]: "invalid-token" };
      const tokenError = new Error(TOKEN_INVALID);
      (verifyAccessToken as jest.Mock).mockRejectedValue(tokenError);

      await expect(
        buildHttpContext(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(TOKEN_INVALID);
    });
  });
});

import { TokenPayload, verifyAccessToken } from "@/auth/verifyAccessToken";
import { SECRET_KEY_INVALID, TOKEN_INVALID } from "@/constants/constants";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("verifyAccessToken", () => {
  const originalEnv = process.env;
  const mockSecret = "jwt-super-access-secret-2026";
  const mockToken = "header.payload.signature";
  const mockPayload: TokenPayload = {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    iat: 1700000000,
    exp: 1700003600,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, ACCESS_SECRET: mockSecret };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Cenários de Sucesso", () => {
    it("deve decodificar e retornar o payload quando o token e a variável de ambiente forem válidos", async () => {
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = await verifyAccessToken(mockToken);

      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, mockSecret);
      expect(result).toEqual(mockPayload);
      expect(result.userId).toBe(mockPayload.userId);
    });
  });

  describe("Cláusula de Guarda: ACCESS_SECRET", () => {
    it("deve lançar erro SECRET_KEY_INVALID se process.env.ACCESS_SECRET for undefined", async () => {
      process.env.ACCESS_SECRET = undefined as unknown as string;

      await expect(verifyAccessToken(mockToken)).rejects.toThrow(
        SECRET_KEY_INVALID
      );
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it("deve lançar erro SECRET_KEY_INVALID se process.env.ACCESS_SECRET for uma string vazia", async () => {
      process.env.ACCESS_SECRET = "";

      await expect(verifyAccessToken(mockToken)).rejects.toThrow(
        SECRET_KEY_INVALID
      );
      expect(jwt.verify).not.toHaveBeenCalled();
    });
  });

  describe("Cláusula de Guarda: Token de Entrada", () => {
    it("deve lançar erro TOKEN_INVALID se o token for uma string vazia", async () => {
      await expect(verifyAccessToken("")).rejects.toThrow(TOKEN_INVALID);
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it("deve lançar erro TOKEN_INVALID se o token for null ou undefined", async () => {
      await expect(
        verifyAccessToken(null as unknown as string)
      ).rejects.toThrow(TOKEN_INVALID);
      await expect(
        verifyAccessToken(undefined as unknown as string)
      ).rejects.toThrow(TOKEN_INVALID);
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it("deve lançar erro TOKEN_INVALID se o token não for do tipo string", async () => {
      await expect(
        verifyAccessToken(12345 as unknown as string)
      ).rejects.toThrow(TOKEN_INVALID);
      await expect(verifyAccessToken({} as unknown as string)).rejects.toThrow(
        TOKEN_INVALID
      );
      expect(jwt.verify).not.toHaveBeenCalled();
    });
  });

  describe("Falhas de Verificação do JWT e Erros de Payload", () => {
    it("deve lançar TOKEN_INVALID se o token estiver expirado (TokenExpiredError)", async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError("jwt expired", new Date());
      });

      await expect(verifyAccessToken(mockToken)).rejects.toThrow(TOKEN_INVALID);
    });

    it("deve lançar TOKEN_INVALID se a assinatura for inválida (JsonWebTokenError)", async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError("invalid signature");
      });

      await expect(verifyAccessToken(mockToken)).rejects.toThrow(TOKEN_INVALID);
    });

    it("deve lançar TOKEN_INVALID se o jwt.verify retornar um payload sem userId", async () => {
      const payloadWithoutUserId = { iat: 1700000000, exp: 1700003600 };
      (jwt.verify as jest.Mock).mockReturnValue(payloadWithoutUserId);

      await expect(verifyAccessToken(mockToken)).rejects.toThrow(TOKEN_INVALID);
    });

    it("deve lançar TOKEN_INVALID se o jwt.verify retornar um valor primitivo ou nulo", async () => {
      (jwt.verify as jest.Mock).mockReturnValue("just-a-plain-string");

      await expect(verifyAccessToken(mockToken)).rejects.toThrow(TOKEN_INVALID);
    });
  });
});

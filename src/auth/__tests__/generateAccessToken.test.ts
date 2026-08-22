import jwt from "jsonwebtoken";

import { generateAccessToken, TokenPayload } from "@/auth/generateAccessToken";
import { SECRET_KEY_INVALID } from "@/constants/constants";

jest.mock("jsonwebtoken");

describe("generateAccessToken", () => {
  const originalEnv = process.env;
  const mockSecret = "super-secret-access-key";
  const mockExpiresIn = "15m";
  const mockToken = "header.payload.signature";

  const validPayload: TokenPayload = {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    email: "abel@example.com",
    username: "abelcarvalho",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      ACCESS_SECRET: mockSecret,
      EXPIRES_IN: mockExpiresIn,
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Cenários de Sucesso", () => {
    it("deve gerar e retornar o token assinado quando payload e envs forem válidos", () => {
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = generateAccessToken(validPayload);

      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith(validPayload, mockSecret, {
        expiresIn: mockExpiresIn,
      });
      expect(result).toBe(mockToken);
    });

    it.each(["100ms", "30s", "15m", "2h", "7d", "4w", "1y"])(
      "deve aceitar diferentes formatos válidos de tempo no EXPIRES_IN: %s",
      (expiryFormat) => {
        process.env.EXPIRES_IN = expiryFormat;
        (jwt.sign as jest.Mock).mockReturnValue(mockToken);

        const result = generateAccessToken(validPayload);

        expect(result).toBe(mockToken);
        expect(jwt.sign).toHaveBeenCalledWith(validPayload, mockSecret, {
          expiresIn: expiryFormat,
        });
      }
    );
  });

  describe("Validação de Variáveis de Ambiente", () => {
    describe("EXPIRES_IN (checkPattern)", () => {
      it("deve lançar erro se EXPIRES_IN for undefined", () => {
        process.env.EXPIRES_IN = undefined as unknown as string;

        expect(() => generateAccessToken(validPayload)).toThrow(
          "Invalid expiration time format. It should be a number or a string with a valid time unit."
        );
        expect(jwt.sign).not.toHaveBeenCalled();
      });

      it("deve lançar erro se EXPIRES_IN for uma string vazia", () => {
        process.env.EXPIRES_IN = "";

        expect(() => generateAccessToken(validPayload)).toThrow(
          "Invalid expiration time format. It should be a number or a string with a valid time unit."
        );
        expect(jwt.sign).not.toHaveBeenCalled();
      });

      it("deve lançar erro se EXPIRES_IN tiver formato ou unidade inválida", () => {
        process.env.EXPIRES_IN = "15invalid";

        expect(() => generateAccessToken(validPayload)).toThrow(
          "Invalid expiration time format. It should be a number or a string with a valid time unit."
        );
        expect(jwt.sign).not.toHaveBeenCalled();
      });
    });

    describe("ACCESS_SECRET", () => {
      it("deve lançar SECRET_KEY_INVALID se ACCESS_SECRET for undefined", () => {
        process.env.ACCESS_SECRET = undefined as unknown as string;

        expect(() => generateAccessToken(validPayload)).toThrow(
          SECRET_KEY_INVALID
        );
        expect(jwt.sign).not.toHaveBeenCalled();
      });

      it("deve lançar SECRET_KEY_INVALID se ACCESS_SECRET for uma string vazia", () => {
        process.env.ACCESS_SECRET = "";

        expect(() => generateAccessToken(validPayload)).toThrow(
          SECRET_KEY_INVALID
        );
        expect(jwt.sign).not.toHaveBeenCalled();
      });
    });
  });

  describe("Cláusulas de Guarda do Payload", () => {
    it("deve lançar erro se o payload for nulo ou indefinido", () => {
      expect(() =>
        generateAccessToken(null as unknown as TokenPayload)
      ).toThrow("Invalid token payload");

      expect(() =>
        generateAccessToken(undefined as unknown as TokenPayload)
      ).toThrow("Invalid token payload");

      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("deve lançar erro se payload.userId for ausente, vazio ou não for string", () => {
      const invalidPayloads = [
        { ...validPayload, userId: "" },
        { ...validPayload, userId: undefined as unknown as string },
        { ...validPayload, userId: 12345 as unknown as string },
      ];

      invalidPayloads.forEach((payload) => {
        expect(() => generateAccessToken(payload)).toThrow(
          "Invalid token payload: userId is required"
        );
      });

      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("deve lançar erro se payload.email for ausente, vazio ou não for string", () => {
      const invalidPayloads = [
        { ...validPayload, email: "" },
        { ...validPayload, email: undefined as unknown as string },
        { ...validPayload, email: 123 as unknown as string },
      ];

      invalidPayloads.forEach((payload) => {
        expect(() => generateAccessToken(payload)).toThrow(
          "Invalid token payload: email is required"
        );
      });

      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("deve lançar erro se payload.username for ausente, vazio ou não for string", () => {
      const invalidPayloads = [
        { ...validPayload, username: "" },
        { ...validPayload, username: undefined as unknown as string },
        { ...validPayload, username: true as unknown as string },
      ];

      invalidPayloads.forEach((payload) => {
        expect(() => generateAccessToken(payload)).toThrow(
          "Invalid token payload: username is required"
        );
      });

      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
});

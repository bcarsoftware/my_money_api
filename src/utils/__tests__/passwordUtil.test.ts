import bcrypt from "bcrypt";

import { hashPassword, comparePassword } from "@/utils/passwordUtil";
import { SALT_ROUNDS_INVALID } from "@/constants/constants";

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe("Password Security & Hashing Utilities", () => {
  const originalEnv = process.env;
  const mockPassword = "UserSecretPassword#2026";
  const mockHashedValue = "$2b$12$e8O1xW...fake.bcrypt.hash";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, SALT_ROUNDS: "12" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("hashPassword & getSaltRounds", () => {
    describe("Cenários de Sucesso", () => {
      it("deve converter o SALT_ROUNDS da env para número e chamar bcrypt.hash com os argumentos corretos", async () => {
        process.env.SALT_ROUNDS = "14";
        (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedValue);

        const result = await hashPassword(mockPassword);

        expect(bcrypt.hash).toHaveBeenCalledTimes(1);
        expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, 14);
        expect(result).toBe(mockHashedValue);
      });
    });

    describe("Validação de SALT_ROUNDS", () => {
      it("deve lançar SALT_ROUNTS_INVALID quando SALT_ROUNDS for undefined", async () => {
        process.env.SALT_ROUNDS = undefined as unknown as string;

        await expect(hashPassword(mockPassword)).rejects.toThrow(
          SALT_ROUNDS_INVALID
        );
        expect(bcrypt.hash).not.toHaveBeenCalled();
      });

      it("deve lançar SALT_ROUNTS_INVALID quando SALT_ROUNDS for string vazia", async () => {
        process.env.SALT_ROUNDS = "";

        await expect(hashPassword(mockPassword)).rejects.toThrow(
          SALT_ROUNDS_INVALID
        );
        expect(bcrypt.hash).not.toHaveBeenCalled();
      });

      it.each(["-10", "10.5", "12a", "abc", " 10", "10 "])(
        "deve rejeitar formato inválido de SALT_ROUNDS: %s",
        async (invalidRounds) => {
          process.env.SALT_ROUNDS = invalidRounds;

          await expect(hashPassword(mockPassword)).rejects.toThrow(
            SALT_ROUNDS_INVALID
          );
          expect(bcrypt.hash).not.toHaveBeenCalled();
        }
      );
    });

    describe("Validação de Senha de Entrada (Cláusulas de Guarda)", () => {
      it("deve lançar erro se a senha for string vazia", async () => {
        await expect(hashPassword("")).rejects.toThrow(
          "Password is required and must be a string"
        );
        expect(bcrypt.hash).not.toHaveBeenCalled();
      });

      it("deve lançar erro se a senha for nula ou indefinida", async () => {
        await expect(hashPassword(null as unknown as string)).rejects.toThrow(
          "Password is required and must be a string"
        );

        await expect(
          hashPassword(undefined as unknown as string)
        ).rejects.toThrow("Password is required and must be a string");

        expect(bcrypt.hash).not.toHaveBeenCalled();
      });

      it("deve lançar erro se a senha não for do tipo string", async () => {
        await expect(hashPassword(123456 as unknown as string)).rejects.toThrow(
          "Password is required and must be a string"
        );

        await expect(hashPassword({} as unknown as string)).rejects.toThrow(
          "Password is required and must be a string"
        );

        expect(bcrypt.hash).not.toHaveBeenCalled();
      });
    });

    describe("Propagação de Erros", () => {
      it("deve repassar exceções geradas internamente pelo bcrypt.hash", async () => {
        const bcryptError = new Error("Bcrypt execution failure");
        (bcrypt.hash as jest.Mock).mockRejectedValue(bcryptError);

        await expect(hashPassword(mockPassword)).rejects.toThrow(bcryptError);
      });
    });
  });

  describe("comparePassword", () => {
    describe("Cenários de Sucesso", () => {
      it("deve retornar true quando a senha corresponder ao hash", async () => {
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const result = await comparePassword(mockPassword, mockHashedValue);

        expect(bcrypt.compare).toHaveBeenCalledTimes(1);
        expect(bcrypt.compare).toHaveBeenCalledWith(
          mockPassword,
          mockHashedValue
        );
        expect(result).toBe(true);
      });

      it("deve retornar false quando a senha não corresponder ao hash", async () => {
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        const result = await comparePassword("WrongPassword", mockHashedValue);

        expect(bcrypt.compare).toHaveBeenCalledTimes(1);
        expect(bcrypt.compare).toHaveBeenCalledWith(
          "WrongPassword",
          mockHashedValue
        );
        expect(result).toBe(false);
      });
    });

    describe("Cláusulas de Guarda (Retorno false sem chamar bcrypt)", () => {
      it("deve retornar false se a senha for vazia, nula ou tipo inválido", async () => {
        expect(await comparePassword("", mockHashedValue)).toBe(false);
        expect(
          await comparePassword(null as unknown as string, mockHashedValue)
        ).toBe(false);
        expect(
          await comparePassword(undefined as unknown as string, mockHashedValue)
        ).toBe(false);
        expect(
          await comparePassword(12345 as unknown as string, mockHashedValue)
        ).toBe(false);

        expect(bcrypt.compare).not.toHaveBeenCalled();
      });

      it("deve retornar false se o hash for vazio, nulo ou tipo inválido", async () => {
        expect(await comparePassword(mockPassword, "")).toBe(false);
        expect(
          await comparePassword(mockPassword, null as unknown as string)
        ).toBe(false);
        expect(
          await comparePassword(mockPassword, undefined as unknown as string)
        ).toBe(false);
        expect(
          await comparePassword(mockPassword, 12345 as unknown as string)
        ).toBe(false);

        expect(bcrypt.compare).not.toHaveBeenCalled();
      });
    });

    describe("Propagação de Erros", () => {
      it("deve repassar exceções se o bcrypt.compare falhar por erro interno", async () => {
        const compareError = new Error("Bcrypt comparison calculation error");
        (bcrypt.compare as jest.Mock).mockRejectedValue(compareError);

        await expect(
          comparePassword(mockPassword, mockHashedValue)
        ).rejects.toThrow(compareError);
      });
    });
  });
});

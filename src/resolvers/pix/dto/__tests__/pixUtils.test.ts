import { PixEnum } from "@/enums/PixEnum";
import { pixChecker } from "@/resolvers/pix/pixUtils";

const VALID_CPF = "11144477735";
const INVALID_CPF_WRONG_DIGITS = "11144477700";
const INVALID_CPF_REPDIGIT = "11111111111";

const VALID_CNPJ = "12ABC34501DE35";
const INVALID_CNPJ_WRONG_DIGITS = "12ABC34501DE00";
const INVALID_CNPJ_REPDIGIT = "00000000000000";

const VALID_UUID_V4 = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const INVALID_UUID_V1 = "550e8400-e29b-11d4-a716-446655440000";

const VALID_PHONE = "+5511999999999";
const INVALID_PHONE = "123456789";
const INVALID_PHONE_WITH_LETTERS = "+5511abcd9999";

describe("pixChecker", () => {
  describe("PixEnum.CPF", () => {
    it("não lança erro para um CPF válido", () => {
      expect(() => pixChecker(PixEnum.CPF, VALID_CPF)).not.toThrow();
    });

    it("lança erro para um CPF com dígitos verificadores incorretos", () => {
      expect(() => pixChecker(PixEnum.CPF, INVALID_CPF_WRONG_DIGITS)).toThrow(
        "CPF is invalid."
      );
    });

    it("lança erro para um CPF com todos os dígitos repetidos", () => {
      expect(() => pixChecker(PixEnum.CPF, INVALID_CPF_REPDIGIT)).toThrow(
        "CPF is invalid."
      );
    });

    it("lança erro para um CPF fora do formato (letras, tamanho errado)", () => {
      expect(() => pixChecker(PixEnum.CPF, "abc")).toThrow("CPF is invalid.");
      expect(() => pixChecker(PixEnum.CPF, "111.444.777-35")).toThrow(
        "CPF is invalid."
      );
    });
  });

  describe("PixEnum.CNPJ", () => {
    it("não lança erro para um CNPJ válido (alfanumérico)", () => {
      expect(() => pixChecker(PixEnum.CNPJ, VALID_CNPJ)).not.toThrow();
    });

    it("lança erro para um CNPJ com dígitos verificadores incorretos", () => {
      expect(() => pixChecker(PixEnum.CNPJ, INVALID_CNPJ_WRONG_DIGITS)).toThrow(
        "CNPJ is invalid."
      );
    });

    it("lança erro para um CNPJ com sequência repetida", () => {
      expect(() => pixChecker(PixEnum.CNPJ, INVALID_CNPJ_REPDIGIT)).toThrow(
        "CNPJ is invalid."
      );
    });

    it("lança erro para um CNPJ com formatação (pontuação)", () => {
      expect(() => pixChecker(PixEnum.CNPJ, "12.ABC.345/01DE-35")).toThrow(
        "CNPJ is invalid."
      );
    });
  });

  describe("PixEnum.EMAIL", () => {
    it("não lança erro para um e-mail válido", () => {
      expect(() =>
        pixChecker(PixEnum.EMAIL, "usuario@exemplo.com")
      ).not.toThrow();
    });

    it("lança erro para um e-mail sem @", () => {
      expect(() => pixChecker(PixEnum.EMAIL, "usuario-exemplo.com")).toThrow(
        "Email is invalid."
      );
    });

    it("lança erro para um e-mail sem domínio", () => {
      expect(() => pixChecker(PixEnum.EMAIL, "usuario@")).toThrow(
        "Email is invalid."
      );
    });

    it("lança erro para string vazia", () => {
      expect(() => pixChecker(PixEnum.EMAIL, "")).toThrow("Email is invalid.");
    });
  });

  describe("PixEnum.RANDOM", () => {
    it("não lança erro para um UUID v4 válido", () => {
      expect(() => pixChecker(PixEnum.RANDOM, VALID_UUID_V4)).not.toThrow();
    });

    it("lança erro para um UUID de versão diferente de 4", () => {
      expect(() => pixChecker(PixEnum.RANDOM, INVALID_UUID_V1)).toThrow(
        "Random key is invalid."
      );
    });

    it("lança erro para uma string que não é UUID", () => {
      expect(() => pixChecker(PixEnum.RANDOM, "não-é-um-uuid")).toThrow(
        "Random key is invalid."
      );
    });
  });

  describe("PixEnum.PHONE", () => {
    it("não lança erro para um número de telefone válido", () => {
      expect(() => pixChecker(PixEnum.PHONE, VALID_PHONE)).not.toThrow();
    });

    it("lança erro para um número de telefone inválido", () => {
      expect(() => pixChecker(PixEnum.PHONE, INVALID_PHONE)).toThrow(
        "Phone number is invalid."
      );
    });

    it("lança erro para um número de telefone com letras", () => {
      expect(() =>
        pixChecker(PixEnum.PHONE, INVALID_PHONE_WITH_LETTERS)
      ).toThrow("Phone number is invalid.");
    });

    it("lança erro para um número de telefone com formatação incorreta", () => {
      expect(() => pixChecker(PixEnum.PHONE, "123-456-7890")).toThrow(
        "Phone number is invalid."
      );
    });
  });

  describe("tipo de chave desconhecido", () => {
    it("lança erro genérico para um typeKey fora do enum", () => {
      expect(() => pixChecker("QUALQUER_OUTRO" as PixEnum, "valor")).toThrow(
        "Invalid Pix key type."
      );
    });
  });
});

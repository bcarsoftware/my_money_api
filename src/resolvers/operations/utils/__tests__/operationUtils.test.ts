import "reflect-metadata";

import {
  balanceCurrencyVerify,
  uuidFourVerify,
} from "@/resolvers/operations/utils/operationUtils";

// ============================================================
// uuidFourVerify
// ============================================================
describe("uuidFourVerify", () => {
  const UUID_V4 = "550e8400-e29b-41d4-a716-446655440000";
  const UUID_V4_ALT = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

  describe("quando o valor é um UUID v4 válido", () => {
    it("retorna true para UUID v4 canônico", () => {
      expect(uuidFourVerify(UUID_V4)).toBe(true);
    });

    it("retorna true para outro UUID v4 válido", () => {
      expect(uuidFourVerify(UUID_V4_ALT)).toBe(true);
    });

    it("retorna true para UUID v4 em caixa alta", () => {
      expect(uuidFourVerify(UUID_V4.toUpperCase())).toBe(true);
    });
  });

  describe("quando o valor não é um UUID v4", () => {
    it("retorna false para UUID v1", () => {
      expect(uuidFourVerify("550e8400-e29b-11d4-a716-446655440000")).toBe(
        false
      );
    });

    it("retorna false para UUID v3", () => {
      expect(uuidFourVerify("550e8400-e29b-31d4-a716-446655440000")).toBe(
        false
      );
    });

    it("retorna false para UUID v5", () => {
      expect(uuidFourVerify("550e8400-e29b-51d4-a716-446655440000")).toBe(
        false
      );
    });

    it("retorna false para string qualquer", () => {
      expect(uuidFourVerify("nao-e-uuid")).toBe(false);
    });

    it("retorna false para string vazia", () => {
      expect(uuidFourVerify("")).toBe(false);
    });

    it("retorna false para UUID sem hífens", () => {
      expect(uuidFourVerify("550e8400e29b41d4a716446655440000")).toBe(false);
    });

    it("retorna false para UUID com caracteres inválidos", () => {
      expect(uuidFourVerify("550e8400-e29b-41d4-a716-44665544000g")).toBe(
        false
      );
    });

    it("retorna false para undefined (cast)", () => {
      expect(uuidFourVerify(undefined as unknown as string)).toBe(false);
    });

    it("retorna false para null (cast)", () => {
      expect(uuidFourVerify(null as unknown as string)).toBe(false);
    });
  });
});

// ============================================================
// balanceCurrencyVerify
// ============================================================
describe("balanceCurrencyVerify", () => {
  describe("quando o valor é uma moeda válida", () => {
    it("retorna true para valor positivo com duas casas decimais", () => {
      expect(balanceCurrencyVerify("100.00")).toBe(true);
    });

    it("retorna true para zero com duas casas decimais", () => {
      expect(balanceCurrencyVerify("0.00")).toBe(true);
    });

    it("retorna true para valor negativo (allow_negatives: true)", () => {
      expect(balanceCurrencyVerify("-50.00")).toBe(true);
    });

    it("retorna true para valor com separador de milhar", () => {
      expect(balanceCurrencyVerify("1,234.56")).toBe(true);
    });

    it("retorna true para valor pequeno", () => {
      expect(balanceCurrencyVerify("0.01")).toBe(true);
    });

    it("retorna true para valor grande", () => {
      expect(balanceCurrencyVerify("999999.99")).toBe(true);
    });
  });

  describe("quando o valor não é uma moeda válida", () => {
    it("retorna false para string vazia", () => {
      expect(balanceCurrencyVerify("")).toBe(false);
    });

    it("retorna false para texto puro", () => {
      expect(balanceCurrencyVerify("nao-e-moeda")).toBe(false);
    });

    it("retorna false para valor com uma casa decimal", () => {
      expect(balanceCurrencyVerify("100.5")).toBe(false);
    });

    it("retorna false para valor com três casas decimais", () => {
      expect(balanceCurrencyVerify("100.000")).toBe(false);
    });

    it("retorna false para valor sem casas decimais", () => {
      expect(balanceCurrencyVerify("100")).toBe(false);
    });

    it("retorna false para valor com vírgula como separador decimal", () => {
      expect(balanceCurrencyVerify("100,00")).toBe(false);
    });

    it("retorna false para undefined (cast)", () => {
      expect(balanceCurrencyVerify(undefined as unknown as string)).toBe(false);
    });

    it("retorna false para null (cast)", () => {
      expect(balanceCurrencyVerify(null as unknown as string)).toBe(false);
    });
  });
});

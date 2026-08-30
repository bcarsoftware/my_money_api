import { phoneVerify } from "@/utils/verifiers/phoneVerify";

describe("phoneVerify", () => {
  // ============================================================
  // Casos válidos (deve retornar true)
  // ============================================================
  describe("valid phone numbers", () => {
    it("deve aceitar números com 10 dígitos (sem +)", () => {
      expect(phoneVerify("1234567890")).toBe(true);
    });

    it("deve aceitar números com 11 dígitos (sem +)", () => {
      expect(phoneVerify("12345678901")).toBe(true);
    });

    it("deve aceitar números com 12 dígitos (sem +)", () => {
      expect(phoneVerify("123456789012")).toBe(true);
    });

    it("deve aceitar números com 13 dígitos (sem +)", () => {
      expect(phoneVerify("1234567890123")).toBe(true);
    });

    it("deve aceitar números com 10 dígitos com +", () => {
      expect(phoneVerify("+1234567890")).toBe(true);
    });

    it("deve aceitar números com 11 dígitos com +", () => {
      expect(phoneVerify("+12345678901")).toBe(true);
    });

    it("deve aceitar números com 12 dígitos com +", () => {
      expect(phoneVerify("+123456789012")).toBe(true);
    });

    it("deve aceitar números com 13 dígitos com +", () => {
      expect(phoneVerify("+1234567890123")).toBe(true);
    });
  });

  // ============================================================
  // Casos inválidos (deve retornar false)
  // ============================================================
  describe("invalid phone numbers", () => {
    it("deve rejeitar string vazia", () => {
      expect(phoneVerify("")).toBe(false);
    });

    it("deve rejeitar números com menos de 10 dígitos", () => {
      expect(phoneVerify("123456789")).toBe(false); // 9 dígitos
      expect(phoneVerify("12345")).toBe(false);
      expect(phoneVerify("1")).toBe(false);
    });

    it("deve rejeitar números com mais de 13 dígitos", () => {
      expect(phoneVerify("12345678901234")).toBe(false); // 14 dígitos
      expect(phoneVerify("123456789012345")).toBe(false);
    });

    it("deve rejeitar números com caracteres não numéricos (exceto + no início)", () => {
      expect(phoneVerify("123-456-7890")).toBe(false);
      expect(phoneVerify("(123) 456-7890")).toBe(false);
      expect(phoneVerify("123.456.7890")).toBe(false);
      expect(phoneVerify("123 456 7890")).toBe(false);
      expect(phoneVerify("12a34567890")).toBe(false);
      expect(phoneVerify("+123-4567890")).toBe(false);
    });

    it("deve rejeitar números com + em posição diferente do início", () => {
      expect(phoneVerify("123+4567890")).toBe(false);
      expect(phoneVerify("1234567890+")).toBe(false);
    });

    it("deve rejeitar números com mais de um +", () => {
      expect(phoneVerify("++1234567890")).toBe(false);
    });

    it("deve rejeitar números com apenas o sinal +", () => {
      expect(phoneVerify("+")).toBe(false);
    });

    it("deve rejeitar números com espaços", () => {
      expect(phoneVerify(" 1234567890")).toBe(false);
      expect(phoneVerify("1234567890 ")).toBe(false);
      expect(phoneVerify("+ 1234567890")).toBe(false);
    });

    it("deve rejeitar números com zeros à esquerda (ainda são válidos se tiverem 10-13 dígitos, mas o regex permite, então não testamos especificamente; apenas garantir que não haja erro)", () => {
      expect(phoneVerify("0000000000")).toBe(true); // 10 dígitos, válido
      expect(phoneVerify("00000000000")).toBe(true); // 11 dígitos
    });
  });

  // ============================================================
  // Casos de borda com tipos (se a função for chamada com não-string)
  // ============================================================
  describe("edge cases with non-string inputs", () => {
    it("deve retornar false para null", () => {
      expect(phoneVerify(null as unknown as string)).toBe(false);
    });

    it("deve retornar false para undefined", () => {
      expect(phoneVerify(undefined as unknown as string)).toBe(false);
    });

    it("deve retornar false para número (convertido para string automaticamente?)", () => {
      // A função espera string, mas se for chamada com número, o JS converte para string
      expect(phoneVerify(1234567890 as unknown as string)).toBe(true); // 10 dígitos
      expect(phoneVerify(123456789 as unknown as string)).toBe(false); // 9 dígitos
    });
  });
});

import { cpfVerify } from "@/utils/verifiers/cpfVerify";

describe("cpfVerify - Validação de CPF", () => {
  describe("Validação de Formato e Tipagem", () => {
    it.each([
      "",
      "123",
      "1234567890",
      "123456789012",
      "123.456.789-09",
      "1234567890a",
      "abcdefghijk",
      "123 456 789",
    ])(
      "deve retornar false para formatos inválidos de entrada: %s",
      (invalidInput) => {
        expect(cpfVerify(invalidInput)).toBe(false);
      }
    );

    it("deve retornar false se o argumento não for do tipo string, for nulo ou indefinido", () => {
      expect(cpfVerify(null as unknown as string)).toBe(false);
      expect(cpfVerify(undefined as unknown as string)).toBe(false);
      expect(cpfVerify(12345678909 as unknown as string)).toBe(false);
      expect(cpfVerify({} as unknown as string)).toBe(false);
    });
  });

  describe("Bloqueio de Sequências de Dígitos Repetidos", () => {
    it.each([
      "00000000000",
      "11111111111",
      "22222222222",
      "33333333333",
      "44444444444",
      "55555555555",
      "66666666666",
      "77777777777",
      "88888888888",
      "99999999999",
    ])("deve retornar false para a sequência repetida: %s", (repeatedCpf) => {
      expect(cpfVerify(repeatedCpf)).toBe(false);
    });
  });

  describe("Cálculo Aritmético dos Dígitos Verificadores", () => {
    it.each([
      "11144477735",
      "12345678909",
      "68613030033",
      "08079786046",
      "53406721079",
    ])(
      "deve retornar true para CPFs matematicamente válidos: %s",
      (validCpf) => {
        expect(cpfVerify(validCpf)).toBe(true);
      }
    );

    it("deve retornar false se o primeiro dígito verificador for inválido", () => {
      expect(cpfVerify("12345678919")).toBe(false);
    });

    it("deve retornar false se o segundo dígito verificador for inválido", () => {
      expect(cpfVerify("12345678908")).toBe(false);
    });

    it("deve retornar false se ambos os dígitos verificadores estiverem errados", () => {
      expect(cpfVerify("12345678999")).toBe(false);
    });

    it("deve retornar false para CPFs com dígitos invertidos", () => {
      expect(cpfVerify("90987654321")).toBe(false);
    });
  });
});

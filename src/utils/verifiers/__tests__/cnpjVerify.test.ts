import { cnpjVerify, computeCheckerDigits } from "@/utils/verifiers/cnpjVerify";

const OFFICIAL_BASE = "12ABC34501DE";
const OFFICIAL_DIGITS = "35";
const OFFICIAL_VALID_CNPJ = `${OFFICIAL_BASE}${OFFICIAL_DIGITS}`;

describe("computeCheckerDigits", () => {
  it("calcula corretamente os dígitos verificadores do exemplo oficial do SERPRO", () => {
    expect(computeCheckerDigits(OFFICIAL_BASE)).toBe(OFFICIAL_DIGITS);
  });

  it("calcula corretamente quando a base é enviada em minúsculas", () => {
    expect(computeCheckerDigits(OFFICIAL_BASE.toLowerCase())).toBe(
      OFFICIAL_DIGITS
    );
  });

  it("sempre retorna exatamente 2 caracteres numéricos", () => {
    const digits = computeCheckerDigits(OFFICIAL_BASE);
    expect(digits).toMatch(/^\d{2}$/);
  });

  it("calcula corretamente uma base puramente numérica (compatibilidade com CNPJ tradicional)", () => {
    const numericBase = "112223330001";
    const digits = computeCheckerDigits(numericBase);
    expect(cnpjVerify(numericBase + digits)).toBe(true);
  });
});

describe("cnpjVerify", () => {
  describe("caminho feliz", () => {
    it("retorna true para o exemplo oficial válido", () => {
      expect(cnpjVerify(OFFICIAL_VALID_CNPJ)).toBe(true);
    });

    it("retorna true quando o CNPJ é enviado em minúsculas", () => {
      expect(cnpjVerify(OFFICIAL_VALID_CNPJ.toLowerCase())).toBe(true);
    });

    it("retorna true para uma base puramente numérica com dígitos corretos", () => {
      const numericBase = "112223330001";
      const digits = computeCheckerDigits(numericBase);
      expect(cnpjVerify(numericBase + digits)).toBe(true);
    });
  });

  describe("sequências com caractere repetido", () => {
    it("rejeita '00000000000000', mesmo com dígitos verificadores que 'fecham' matematicamente", () => {
      expect(cnpjVerify("00000000000000")).toBe(false);
    });

    it.each(["1", "5", "9", "A", "K", "Z"])(
      "rejeita a base toda repetida com o caractere '%s', mesmo com os dígitos verificadores corretos calculados",
      (char) => {
        const base = char.repeat(12);
        const digits = computeCheckerDigits(base);
        // Antes da correção, TODAS as 36 combinações possíveis (0-9, A-Z)
        // passavam aqui, já que a soma ponderada de um valor constante
        // sempre fecha o módulo 11 por coincidência matemática.
        expect(cnpjVerify(base + digits)).toBe(false);
      }
    );

    it("continua aceitando uma base com dígitos repetidos em BLOCOS, mas não idêntica em todas as posições", () => {
      // "112223330001" tem repetições parciais (11, 222, 333, 000), mas
      // não é o mesmo caractere em toda a base — não deve ser afetada
      // pela blocklist de sequência totalmente repetida.
      const numericBase = "112223330001";
      const digits = computeCheckerDigits(numericBase);
      expect(cnpjVerify(numericBase + digits)).toBe(true);
    });
  });

  describe("dígitos verificadores incorretos", () => {
    it("retorna false quando os dígitos verificadores são adulterados", () => {
      expect(cnpjVerify(`${OFFICIAL_BASE}00`)).toBe(false);
    });

    it("retorna false quando apenas o segundo dígito verificador é adulterado", () => {
      expect(cnpjVerify(`${OFFICIAL_BASE}30`)).toBe(false);
    });

    it("retorna false quando um caractere da base é alterado (mesmos dígitos verificadores)", () => {
      // Troca o primeiro caractere da base (1 -> 9), mantendo os dígitos
      // verificadores originais, que não são mais válidos para essa base.
      const baseAdulterada = `9${OFFICIAL_BASE.slice(1)}`;
      expect(cnpjVerify(baseAdulterada + OFFICIAL_DIGITS)).toBe(false);
    });
  });

  describe("formato inválido", () => {
    it("retorna false para string vazia", () => {
      expect(cnpjVerify("")).toBe(false);
    });

    it("retorna false quando tem menos de 14 caracteres", () => {
      expect(cnpjVerify(OFFICIAL_VALID_CNPJ.slice(0, 13))).toBe(false);
    });

    it("retorna false quando tem mais de 14 caracteres", () => {
      expect(cnpjVerify(`${OFFICIAL_VALID_CNPJ}9`)).toBe(false);
    });

    it("retorna false quando os dígitos verificadores contêm letras", () => {
      expect(cnpjVerify(`${OFFICIAL_BASE}3A`)).toBe(false);
    });

    it("retorna false para CNPJ formatado com pontuação (12.ABC.345/01DE-35) — a função não remove máscara", () => {
      expect(cnpjVerify("12.ABC.345/01DE-35")).toBe(false);
    });

    it("retorna false quando a base contém caracteres não alfanuméricos", () => {
      expect(cnpjVerify(`12@BC34501DE${OFFICIAL_DIGITS}`)).toBe(false);
    });
  });
});

import { INVALID_CURRENCY_FORMAT } from "@/constants/constants";
import {
  clearDecimal,
  decimalDivide,
  decimalMultiply,
  decimalSum,
} from "@/utils/currencyUtil";

describe("clearDecimal", () => {
  it("deve remover espaços em branco no início e fim", () => {
    expect(clearDecimal("  123.45  ")).toBe("123.45");
    expect(clearDecimal("\t456.78\n")).toBe("456.78");
  });

  it("deve remover todas as vírgulas", () => {
    expect(clearDecimal("1,234.56")).toBe("1234.56");
    expect(clearDecimal("1,234,567.89")).toBe("1234567.89");
    expect(clearDecimal("1,234.56,78")).toBe("1234.5678");
  });

  it("deve remover espaços e vírgulas simultaneamente", () => {
    expect(clearDecimal(" 1,234.56 ")).toBe("1234.56");
    expect(clearDecimal(" 1,234,567.89 ")).toBe("1234567.89");
  });

  it("deve retornar string vazia se entrada for vazia", () => {
    expect(clearDecimal("")).toBe("");
    expect(clearDecimal("   ")).toBe("");
  });

  it("deve manter sinais negativos", () => {
    expect(clearDecimal(" -1,234.56 ")).toBe("-1234.56");
  });
});

describe("decimalSum", () => {
  it("deve somar dois números com duas casas decimais", () => {
    expect(decimalSum("15.75", "10.25")).toBe("26.00");
    expect(decimalSum("0.10", "0.20")).toBe("0.30");
  });

  it("deve somar números com uma casa decimal (completa com zero)", () => {
    expect(decimalSum("15.7", "10.2")).toBe("25.90");
    expect(decimalSum("0.5", "0.5")).toBe("1.00");
  });

  it("deve somar números sem casas decimais (considera .00)", () => {
    expect(decimalSum("15", "10")).toBe("25.00");
    expect(decimalSum("0", "0")).toBe("0.00");
  });

  it("deve somar números negativos", () => {
    expect(decimalSum("-15.75", "-10.25")).toBe("-26.00");
    expect(decimalSum("-15.75", "10.25")).toBe("-5.50");
    expect(decimalSum("15.75", "-10.25")).toBe("5.50");
  });

  it("deve somar números com zeros à esquerda", () => {
    expect(decimalSum("00015.75", "00010.25")).toBe("26.00");
    expect(decimalSum("-00015.75", "00010.25")).toBe("-5.50");
  });

  it("deve somar números com vírgulas (limpa antes)", () => {
    expect(decimalSum("1,234.56", "2,345.67")).toBe("3580.23");
    expect(decimalSum("1,234.56", "-2,345.67")).toBe("-1111.11");
  });

  it("deve somar números com espaços (limpa antes)", () => {
    expect(decimalSum(" 15.75 ", " 10.25 ")).toBe("26.00");
  });

  it("deve lançar erro INVALID_CURRENCY_FORMAT se o formato for inválido", () => {
    const invalidValues = [
      "abc",
      "12.345",
      "12.3.4",
      "12,34.56",
      "12.34.56",
      "-",
      "--123",
      "12..34",
      ".",
      "-.",
      "1.2.3",
    ];

    invalidValues.forEach((val) => {
      expect(() => decimalSum(val, "10.00")).toThrow(INVALID_CURRENCY_FORMAT);
      expect(() => decimalSum("10.00", val)).toThrow(INVALID_CURRENCY_FORMAT);
    });
  });

  it("deve lançar erro se a string estiver vazia", () => {
    expect(() => decimalSum("", "10.00")).toThrow(INVALID_CURRENCY_FORMAT);
    expect(() => decimalSum("10.00", "")).toThrow(INVALID_CURRENCY_FORMAT);
    expect(() => decimalSum(" ", "10.00")).toThrow(INVALID_CURRENCY_FORMAT);
  });
});

describe("decimalMultiply", () => {
  it("deve multiplicar dois números com duas casas decimais", () => {
    expect(decimalMultiply("15.75", "10.25")).toBe("161.44");
    expect(decimalMultiply("0.10", "0.20")).toBe("0.02");
  });

  it("deve multiplicar números com uma casa decimal", () => {
    expect(decimalMultiply("15.7", "10.2")).toBe("160.14");
    expect(decimalMultiply("0.5", "0.5")).toBe("0.25");
  });

  it("deve multiplicar números sem casas decimais", () => {
    expect(decimalMultiply("15", "10")).toBe("150.00");
    expect(decimalMultiply("0", "5")).toBe("0.00");
  });

  it("deve multiplicar números negativos", () => {
    expect(decimalMultiply("-15.75", "10.25")).toBe("-161.44");
    expect(decimalMultiply("-15.75", "-10.25")).toBe("161.44");
  });

  it("deve multiplicar números com zeros à esquerda e vírgulas", () => {
    expect(decimalMultiply("00015.75", "00010.25")).toBe("161.44");
    expect(decimalMultiply("1,234.56", "2")).toBe("2469.12");
  });

  it("deve lançar erro para formato inválido", () => {
    expect(() => decimalMultiply("abc", "10.00")).toThrow(
      INVALID_CURRENCY_FORMAT
    );
    expect(() => decimalMultiply("10.00", "12.345")).toThrow(
      INVALID_CURRENCY_FORMAT
    );
  });
});

describe("decimalDivide", () => {
  it("deve dividir dois números com duas casas decimais", () => {
    expect(decimalDivide("15.75", "10.25")).toBe("1.5365853658536585");
    expect(decimalDivide("0.10", "0.20")).toBe("0.5");
  });

  it("deve dividir números com uma casa decimal", () => {
    expect(decimalDivide("15.7", "10.2")).toBe("1.5392156862745098");
    expect(decimalDivide("0.5", "0.5")).toBe("1");
  });

  it("deve dividir números sem casas decimais", () => {
    expect(decimalDivide("15", "10")).toBe("1.5");
    expect(decimalDivide("0", "5")).toBe("0");
  });

  it("deve dividir números negativos", () => {
    expect(decimalDivide("-15.75", "10.25")).toBe("-1.5365853658536585");
    expect(decimalDivide("-15.75", "-10.25")).toBe("1.5365853658536585");
  });

  it("deve lançar erro ao dividir por zero", () => {
    expect(() => decimalDivide("15.75", "0")).toThrow(
      "Division by zero is not allowed."
    );
    expect(() => decimalDivide("15.75", "0.00")).toThrow(
      "Division by zero is not allowed."
    );
    expect(() => decimalDivide("15.75", "-0")).toThrow(
      "Division by zero is not allowed."
    );
  });

  it("deve lançar erro para formato inválido", () => {
    expect(() => decimalDivide("abc", "10.00")).toThrow(
      INVALID_CURRENCY_FORMAT
    );
    expect(() => decimalDivide("10.00", "12.345")).toThrow(
      INVALID_CURRENCY_FORMAT
    );
  });

  it("deve funcionar com vírgulas e espaços", () => {
    expect(decimalDivide(" 1,234.56 ", " 2 ")).toBe("617.28");
  });
});

describe("Casos limites (indiretos)", () => {
  it("deve tratar corretamente números com apenas um dígito decimal (pad com zero)", () => {
    expect(decimalSum("5.5", "0")).toBe("5.50");
    expect(decimalSum("0.1", "0.2")).toBe("0.30");
  });

  it('deve tratar corretamente números sem parte decimal (pad com "00")', () => {
    expect(decimalSum("5", "0")).toBe("5.00");
    expect(decimalSum("0", "0")).toBe("0.00");
  });

  it("deve tratar corretamente números com zeros à esquerda", () => {
    expect(decimalSum("0005.50", "0000.10")).toBe("5.60");
    expect(decimalSum("-0005.50", "0000.10")).toBe("-5.40");
  });

  it("deve tratar corretamente números com apenas sinal negativo e zeros", () => {
    expect(decimalSum("-0.00", "0.00")).toBe("0.00");
    expect(decimalSum("-0.50", "0.50")).toBe("0.00");
  });

  it("deve rejeitar números com mais de duas casas decimais", () => {
    expect(() => decimalSum("1.234", "1")).toThrow(INVALID_CURRENCY_FORMAT);
    expect(() => decimalSum("1", "1.2345")).toThrow(INVALID_CURRENCY_FORMAT);
    expect(() => decimalMultiply("1.234", "1")).toThrow(
      INVALID_CURRENCY_FORMAT
    );
    expect(() => decimalDivide("1.234", "1")).toThrow(INVALID_CURRENCY_FORMAT);
  });

  it("deve rejeitar números com separador decimal incorreto (vírgula)", () => {
    expect(() => decimalSum("1,23", "1")).toThrow(INVALID_CURRENCY_FORMAT);
  });
});

describe("Integração", () => {
  it("deve executar uma sequência de operações sem erros", () => {
    const a = "10.50";
    const b = "20.30";
    const c = "2";
    const d = "-5.27";
    const e = "17.2";

    const soma = decimalSum(a, b);
    const soma2 = decimalSum(b, e);
    const subtracao = decimalSum(c, d);
    const produto = decimalMultiply(soma, c);
    const divisao = decimalDivide(produto, "2");

    expect(soma).toBe("30.80");
    expect(soma2).toBe("37.50");
    expect(divisao).toBe("30.8");
    expect(parseFloat(divisao)).toBeCloseTo(30.8, 10);
    expect(subtracao).toBe("-3.27");
    expect(produto).toBe("61.60");
  });
});

import "reflect-metadata";

import { validate, ValidationError, ValidationOptions } from "class-validator";
import { IS_NOT_ZERO, IsNotZero, isNotZero } from "../IsNotZero";

// ============================================================
// Helpers
// ============================================================
function constraintsFor(errors: ValidationError[], property: string): string[] {
  const error = errors.find((e) => e.property === property);
  return error?.constraints ? Object.keys(error.constraints) : [];
}

function constraintMessage(
  errors: ValidationError[],
  property: string,
  key: string
): string | undefined {
  const error = errors.find((e) => e.property === property);
  return error?.constraints?.[key];
}

/**
 * Cria dinamicamente uma classe com o decorator aplicado.
 * Útil para testar variantes de `ValidationOptions`.
 */
function makeClassWithDecorator(options?: ValidationOptions) {
  class TestInput {
    @IsNotZero(options)
    balance!: string;

    constructor(balance: string) {
      this.balance = balance;
    }
  }
  return TestInput;
}

// ============================================================
// isNotZero (função pura)
// ============================================================
describe("isNotZero", () => {
  describe("valores que são zero (retorna false)", () => {
    it.each([
      "0",
      "00",
      "000",
      "0.0",
      "0.00",
      "00.00",
      ".0",
      ".00",
      "0000.0000",
    ])("retorna false para %s", (value) => {
      expect(isNotZero(value)).toBe(false);
    });
  });

  describe("valores que não são zero (retorna true)", () => {
    it.each(["1", "100", "10.00", "0.01", "0.10", "1.0", "-0", "abc", ""])(
      "retorna true para %s",
      (value) => {
        expect(isNotZero(value)).toBe(true);
      }
    );
  });

  describe("quando o valor não é string", () => {
    it("retorna false para undefined", () => {
      expect(isNotZero(undefined)).toBe(false);
    });

    it("retorna false para null", () => {
      expect(isNotZero(null)).toBe(false);
    });

    it("retorna false para number (mesmo sendo 0)", () => {
      expect(isNotZero(0)).toBe(false);
    });

    it("retorna false para number (mesmo sendo 1)", () => {
      expect(isNotZero(1)).toBe(false);
    });

    it("retorna false para boolean", () => {
      expect(isNotZero(true)).toBe(false);
      expect(isNotZero(false)).toBe(false);
    });

    it("retorna false para object", () => {
      expect(isNotZero({})).toBe(false);
    });

    it("retorna false para array", () => {
      expect(isNotZero([])).toBe(false);
    });
  });
});

// ============================================================
// IsNotZero (decorator via class-validator)
// ============================================================
describe("IsNotZero decorator", () => {
  const TestInput = makeClassWithDecorator();

  it("passa quando o valor não é zero", async () => {
    const input = new TestInput("100.00");
    const errors = await validate(input);

    expect(errors).toHaveLength(0);
  });

  it("passa quando o valor é 0.01", async () => {
    const input = new TestInput("0.01");
    const errors = await validate(input);

    expect(errors).toHaveLength(0);
  });

  it("falha quando o valor é '0'", async () => {
    const input = new TestInput("0");
    const errors = await validate(input);

    expect(constraintsFor(errors, "balance")).toContain(IS_NOT_ZERO);
  });

  it("falha quando o valor é '0.00'", async () => {
    const input = new TestInput("0.00");
    const errors = await validate(input);

    expect(constraintsFor(errors, "balance")).toContain(IS_NOT_ZERO);
  });

  it("falha quando o valor é '00.00'", async () => {
    const input = new TestInput("00.00");
    const errors = await validate(input);

    expect(constraintsFor(errors, "balance")).toContain(IS_NOT_ZERO);
  });

  it("falha quando o valor é '.0'", async () => {
    const input = new TestInput(".0");
    const errors = await validate(input);

    expect(constraintsFor(errors, "balance")).toContain(IS_NOT_ZERO);
  });

  it("registra o constraint sob o nome 'isNotZero'", async () => {
    const input = new TestInput("0");
    const errors = await validate(input);

    expect(constraintsFor(errors, "balance")).toEqual([IS_NOT_ZERO]);
    expect(IS_NOT_ZERO).toBe("isNotZero");
  });

  it("usa a mensagem padrão '<property> must not be zero.'", async () => {
    const input = new TestInput("0");
    const errors = await validate(input);

    const message = constraintMessage(errors, "balance", IS_NOT_ZERO);
    expect(message).toBe("balance must not be zero.");
  });

  it("aceita mensagem customizada via ValidationOptions", async () => {
    const CustomInput = makeClassWithDecorator({
      message: "não pode ser zero, mestre",
    });

    const input = new CustomInput("0");
    const errors = await validate(input);

    const message = constraintMessage(errors, "balance", IS_NOT_ZERO);
    expect(message).toBe("não pode ser zero, mestre");
  });

  it("aceita múltiplos valores válidos sem disparar erro", async () => {
    const values = ["1", "100", "10.00", "0.10", "1.0", "-0", "abc"];
    for (const value of values) {
      const input = new TestInput(value);
      const errors = await validate(input);
      expect(errors).toHaveLength(0);
    }
  });

  it("rejeita múltiplos valores zerados", async () => {
    const values = [
      "0",
      "00",
      "000",
      "0.0",
      "0.00",
      ".0",
      ".00",
      "0,0",
      "0,00",
      "0.0.00",
    ];
    for (const value of values) {
      const input = new TestInput(value);
      const errors = await validate(input);
      expect(constraintsFor(errors, "balance")).toContain(IS_NOT_ZERO);
    }
  });

  it("rejeita valor não-string (undefined)", async () => {
    const input = new TestInput(undefined as unknown as string);
    const errors = await validate(input);

    expect(constraintsFor(errors, "balance")).toContain(IS_NOT_ZERO);
  });

  it("rejeita valor não-string (number)", async () => {
    const input = new TestInput(100 as unknown as string);
    const errors = await validate(input);

    expect(constraintsFor(errors, "balance")).toContain(IS_NOT_ZERO);
  });
});

import "reflect-metadata";

import { IsPhone, isPhone } from "@/utils/verifiers/decorators/IsPhone";
import { IsOptional, validate, ValidationError } from "class-validator";

// ============================================================
// Testes para a função isPhone
// ============================================================
describe("isPhone", () => {
  // --------------------------------------------
  // Casos válidos (deve retornar true)
  // --------------------------------------------
  describe("valid phone numbers", () => {
    it("deve retornar true para strings com 10 dígitos (sem +)", () => {
      expect(isPhone("1234567890")).toBe(true);
    });

    it("deve retornar true para strings com 11 dígitos (sem +)", () => {
      expect(isPhone("12345678901")).toBe(true);
    });

    it("deve retornar true para strings com 12 dígitos (sem +)", () => {
      expect(isPhone("123456789012")).toBe(true);
    });

    it("deve retornar true para strings com 13 dígitos (sem +)", () => {
      expect(isPhone("1234567890123")).toBe(true);
    });

    it("deve retornar true para strings com 10 dígitos com +", () => {
      expect(isPhone("+1234567890")).toBe(true);
    });

    it("deve retornar true para strings com 11 dígitos com +", () => {
      expect(isPhone("+12345678901")).toBe(true);
    });

    it("deve retornar true para strings com 12 dígitos com +", () => {
      expect(isPhone("+123456789012")).toBe(true);
    });

    it("deve retornar true para strings com 13 dígitos com +", () => {
      expect(isPhone("+1234567890123")).toBe(true);
    });
  });

  // --------------------------------------------
  // Casos inválidos (deve retornar false)
  // --------------------------------------------
  describe("invalid phone numbers", () => {
    it("deve retornar false para null", () => {
      expect(isPhone(null)).toBe(false);
    });

    it("deve retornar false para undefined", () => {
      expect(isPhone(undefined)).toBe(false);
    });

    it("deve retornar false para número (não é string)", () => {
      expect(isPhone(1234567890)).toBe(false);
    });

    it("deve retornar false para string vazia", () => {
      expect(isPhone("")).toBe(false);
    });

    it("deve retornar false para números com menos de 10 dígitos", () => {
      expect(isPhone("123456789")).toBe(false); // 9 dígitos
      expect(isPhone("12345")).toBe(false);
      expect(isPhone("1")).toBe(false);
    });

    it("deve retornar false para números com mais de 13 dígitos", () => {
      expect(isPhone("12345678901234")).toBe(false); // 14 dígitos
      expect(isPhone("123456789012345")).toBe(false);
    });

    it("deve retornar false para números com caracteres não numéricos (exceto + no início)", () => {
      expect(isPhone("123-456-7890")).toBe(false);
      expect(isPhone("(123) 456-7890")).toBe(false);
      expect(isPhone("123.456.7890")).toBe(false);
      expect(isPhone("123 456 7890")).toBe(false);
      expect(isPhone("12a34567890")).toBe(false);
      expect(isPhone("+123-4567890")).toBe(false);
    });

    it("deve retornar false para números com + em posição diferente do início", () => {
      expect(isPhone("123+4567890")).toBe(false);
      expect(isPhone("1234567890+")).toBe(false);
    });

    it("deve retornar false para números com mais de um +", () => {
      expect(isPhone("++1234567890")).toBe(false);
    });

    it("deve retornar false para números com apenas o sinal +", () => {
      expect(isPhone("+")).toBe(false);
    });

    it("deve retornar false para números com espaços", () => {
      expect(isPhone(" 1234567890")).toBe(false);
      expect(isPhone("1234567890 ")).toBe(false);
      expect(isPhone("+ 1234567890")).toBe(false);
    });
  });
});

// ============================================================
// Testes para o decorador IsPhone
// ============================================================
describe("IsPhone decorator", () => {
  // Helper para obter constraints de um campo específico
  function constraintsFor(
    errors: ValidationError[],
    property: string
  ): string[] {
    const error = errors.find((e) => e.property === property);
    return error?.constraints ? Object.keys(error.constraints) : [];
  }

  // Classe de teste
  class TestUser {
    @IsPhone()
    phone: string;

    constructor(phone: string) {
      this.phone = phone;
    }
  }

  // Classe de teste com mensagem personalizada
  class TestUserWithCustomMessage {
    @IsPhone({ message: "Custom error: invalid phone number" })
    phone: string;

    constructor(phone: string) {
      this.phone = phone;
    }
  }

  // Classe de teste com campo opcional
  class TestUserOptional {
    @IsOptional()
    @IsPhone()
    phone?: string | null;

    constructor(phone?: string | null) {
      this.phone = phone;
    }
  }

  describe("validação", () => {
    it("deve validar com sucesso para um número de telefone válido", async () => {
      const user = new TestUser("11999999999");
      const errors = await validate(user);
      expect(errors).toHaveLength(0);
    });

    it("deve retornar erro para um número de telefone inválido", async () => {
      const user = new TestUser("123");
      const errors = await validate(user);
      expect(errors).toHaveLength(1);
      expect(errors[0]!.property).toBe("phone");
      expect(errors[0]!.constraints).toHaveProperty("isPhone");
      expect(errors[0]!.constraints!.isPhone).toBe(
        "phone must be a valid Phone number."
      );
    });

    it("deve retornar erro para string vazia", async () => {
      const user = new TestUser("");
      const errors = await validate(user);
      expect(errors).toHaveLength(1);
      expect(constraintsFor(errors, "phone")).toContain("isPhone");
    });

    it("deve retornar erro para null (campo obrigatório)", async () => {
      const user = new TestUser(null as unknown as string);
      const errors = await validate(user);
      expect(errors).toHaveLength(1);
      expect(constraintsFor(errors, "phone")).toContain("isPhone");
    });

    it("deve retornar erro para undefined (campo obrigatório)", async () => {
      const user = new TestUser(undefined as unknown as string);
      const errors = await validate(user);
      expect(errors).toHaveLength(1);
      expect(constraintsFor(errors, "phone")).toContain("isPhone");
    });

    it("deve usar a mensagem de erro personalizada quando fornecida", async () => {
      const user = new TestUserWithCustomMessage("123");
      const errors = await validate(user);
      expect(errors).toHaveLength(1);
      expect(errors[0]!.property).toBe("phone");
      expect(errors[0]!.constraints!.isPhone).toBe(
        "Custom error: invalid phone number"
      );
    });

    it("deve aceitar null quando o campo é opcional (nullable)", async () => {
      const user = new TestUserOptional(null);
      const errors = await validate(user);
      expect(errors).toHaveLength(0);
    });

    it("deve aceitar undefined quando o campo é opcional", async () => {
      const user = new TestUserOptional(undefined);
      const errors = await validate(user);
      expect(errors).toHaveLength(0);
    });

    it("deve validar números com o prefixo + corretamente", async () => {
      const user = new TestUser("+5511999999999");
      const errors = await validate(user);
      expect(errors).toHaveLength(0);
    });

    it("deve rejeitar números com caracteres especiais", async () => {
      const user = new TestUser("(11) 99999-9999");
      const errors = await validate(user);
      expect(errors).toHaveLength(1);
      expect(constraintsFor(errors, "phone")).toContain("isPhone");
    });

    it("deve rejeitar números com menos de 10 dígitos", async () => {
      const user = new TestUser("123456789");
      const errors = await validate(user);
      expect(errors).toHaveLength(1);
      expect(constraintsFor(errors, "phone")).toContain("isPhone");
    });

    it("deve rejeitar números com mais de 13 dígitos", async () => {
      const user = new TestUser("12345678901234");
      const errors = await validate(user);
      expect(errors).toHaveLength(1);
      expect(constraintsFor(errors, "phone")).toContain("isPhone");
    });
  });
});

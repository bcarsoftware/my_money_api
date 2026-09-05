import "reflect-metadata";

import { MonthEnum } from "@/enums/MonthEnum";
import { PaymentEnum } from "@/enums/PaymentEnum";
import { RepeatEnum } from "@/enums/RepeatEnum";
import {
  CreatePaymentInput,
  ListPaymentInput,
  UpdatePaymentInput,
} from "@/resolvers/payment/PaymentInputs";
import { validate, ValidationError } from "class-validator";

// ============================================================
// Helpers
// ============================================================
async function validateInput<T extends object>(
  Ctor: new () => T,
  plain: Partial<T>
): Promise<ValidationError[]> {
  const instance = Object.assign(new Ctor(), plain);
  return validate(instance);
}

function constraintsFor(errors: ValidationError[], property: string): string[] {
  const error = errors.find((e) => e.property === property);
  return error?.constraints ? Object.keys(error.constraints) : [];
}

// ============================================================
// CreatePaymentInput
// ============================================================
describe("CreatePaymentInput", () => {
  const validPayload = {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    name: "Aluguel",
    description: "Pagamento do aluguel mensal",
    repeat: RepeatEnum.NO_REPEAT,
    balance: "1500.00",
    day: 5,
    month: MonthEnum.JANUARY,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(CreatePaymentInput, validPayload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com description omitida (opcional)", async () => {
      const { description, ...payload } = validPayload;
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com description null", async () => {
      const payload = { ...validPayload, description: null };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("userId", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        userId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "userId")).toHaveLength(0);
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { name, ...payload } = validPayload;
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });
  });

  describe("name", () => {
    it("aceita exatamente 64 caracteres (limite)", async () => {
      const payload = { ...validPayload, name: "a".repeat(64) };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres (acima do limite)", async () => {
      const payload = { ...validPayload, name: "a".repeat(65) };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { name, ...payload } = validPayload;
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        name: null,
      } as unknown as CreatePaymentInput;
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres (limite)", async () => {
      const payload = { ...validPayload, description: "a".repeat(256) };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres (acima do limite)", async () => {
      const payload = { ...validPayload, description: "a".repeat(257) };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, description: null };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const { description, ...payload } = validPayload;
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });
  });

  describe("repeat", () => {
    it("aceita todos os valores do enum RepeatEnum", async () => {
      for (const repeat of Object.values(RepeatEnum)) {
        const payload = { ...validPayload, repeat };
        const errors = await validateInput(CreatePaymentInput, payload);
        expect(constraintsFor(errors, "repeat")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const payload = {
        ...validPayload,
        repeat: "INVALIDO" as unknown as RepeatEnum,
      };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "repeat")).toContain("isEnum");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { repeat, ...payload } = validPayload;
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "repeat")).toContain("isEnum");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        repeat: null,
      } as unknown as CreatePaymentInput;
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "repeat")).toContain("isEnum");
    });
  });

  describe("balance", () => {
    it.each(["100.00", "0.00", "1,234.56", "50.00"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const payload = { ...validPayload, balance: value };
        const errors = await validateInput(CreatePaymentInput, payload);
        expect(constraintsFor(errors, "balance")).toHaveLength(0);
      }
    );

    it("rejeita valores negativos (allow_negatives: false)", async () => {
      const payload = { ...validPayload, balance: "-50.00" };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const payload = { ...validPayload, balance: value };
        const errors = await validateInput(CreatePaymentInput, payload);
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { balance, ...payload } = validPayload;
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("day", () => {
    it("aceita 1 (valor mínimo)", async () => {
      const payload = { ...validPayload, day: 1 };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "day")).toHaveLength(0);
    });

    it("aceita 31 (valor máximo)", async () => {
      const payload = { ...validPayload, day: 31 };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "day")).toHaveLength(0);
    });

    it("aceita valor entre 1 e 31", async () => {
      const payload = { ...validPayload, day: 15 };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "day")).toHaveLength(0);
    });

    it("rejeita 0 (menor que mínimo)", async () => {
      const payload = { ...validPayload, day: 0 };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "day")).toContain("min");
    });

    it("rejeita 32 (maior que máximo)", async () => {
      const payload = { ...validPayload, day: 32 };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "day")).toContain("max");
    });

    it("rejeita valor negativo", async () => {
      const payload = { ...validPayload, day: -5 };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "day")).toContain("min");
    });

    it("rejeita valor não inteiro", async () => {
      const payload = { ...validPayload, day: 10.5 as unknown as number };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "day")).toContain("isInt");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { day, ...payload } = validPayload;
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "day")).toContain("isInt");
    });
  });

  describe("month", () => {
    it("aceita todos os valores do enum MonthEnum", async () => {
      for (const month of Object.values(MonthEnum)) {
        const payload = { ...validPayload, month };
        const errors = await validateInput(CreatePaymentInput, payload);
        expect(constraintsFor(errors, "month")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const payload = {
        ...validPayload,
        month: "INVALIDO" as unknown as MonthEnum,
      };
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "month")).toContain("isEnum");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { month, ...payload } = validPayload;
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "month")).toContain("isEnum");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        month: null,
      } as unknown as CreatePaymentInput;
      const errors = await validateInput(CreatePaymentInput, payload);
      expect(constraintsFor(errors, "month")).toContain("isEnum");
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        name: "a".repeat(65),
        repeat: "INVALIDO" as unknown as RepeatEnum,
        balance: "-50.00",
        day: 0,
        month: "INVALIDO" as unknown as MonthEnum,
      };
      const errors = await validateInput(CreatePaymentInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["balance", "day", "month", "name", "repeat"].sort()
      );
    });
  });
});

// ============================================================
// ListPaymentInput
// ============================================================
describe("ListPaymentInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos os campos opcionais)", async () => {
      const errors = await validateInput(ListPaymentInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        limit: 10,
        offset: 0,
        name: "Aluguel",
        repeat: RepeatEnum.NO_REPEAT,
        month: MonthEnum.JANUARY,
      };
      const errors = await validateInput(ListPaymentInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("limit", () => {
    it("aceita 0", async () => {
      const input = { limit: 0 };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const input = { limit: 5 };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const input = { limit: 10.5 as unknown as number };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "limit")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const input = { limit: -1 };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "limit")).toContain("min");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { limit: undefined };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });
  });

  describe("offset", () => {
    it("aceita 0", async () => {
      const input = { offset: 0 };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const input = { offset: 2 };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const input = { offset: 1.5 as unknown as number };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "offset")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const input = { offset: -1 };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "offset")).toContain("min");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { offset: undefined };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });
  });

  describe("name (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const input = { name: "a".repeat(64) };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const input = { name: "a".repeat(65) };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { name: undefined };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });
  });

  describe("repeat (opcional)", () => {
    it("aceita todos os valores do enum RepeatEnum", async () => {
      for (const repeat of Object.values(RepeatEnum)) {
        const input = { repeat };
        const errors = await validateInput(ListPaymentInput, input);
        expect(constraintsFor(errors, "repeat")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const input = { repeat: "INVALIDO" as unknown as RepeatEnum };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "repeat")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { repeat: undefined };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "repeat")).toHaveLength(0);
    });
  });

  describe("month (opcional)", () => {
    it("aceita todos os valores do enum MonthEnum", async () => {
      for (const month of Object.values(MonthEnum)) {
        const input = { month };
        const errors = await validateInput(ListPaymentInput, input);
        expect(constraintsFor(errors, "month")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const input = { month: "INVALIDO" as unknown as MonthEnum };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "month")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { month: undefined };
      const errors = await validateInput(ListPaymentInput, input);
      expect(constraintsFor(errors, "month")).toHaveLength(0);
    });
  });

  describe("status (opcional)", () => {
    it("aceita todos os valores do enum PaymentEnum", async () => {
      for (const status of Object.values(PaymentEnum)) {
        const input = { status };
        const errors = await validateInput(UpdatePaymentInput, input);
        expect(constraintsFor(errors, "status")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const input = { status: "INVALIDO" as unknown as PaymentEnum };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "status")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { status: undefined };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "status")).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const input = {
        limit: -1,
        offset: -1,
        name: "a".repeat(65),
        repeat: "INVALIDO" as unknown as RepeatEnum,
        month: "INVALIDO" as unknown as MonthEnum,
        status: "INVALIDO" as unknown as PaymentEnum,
      };
      const errors = await validateInput(ListPaymentInput, input);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["limit", "month", "name", "offset", "repeat", "status"].sort()
      );
    });
  });
});

// ============================================================
// UpdatePaymentInput
// ============================================================
describe("UpdatePaymentInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos os campos opcionais)", async () => {
      const errors = await validateInput(UpdatePaymentInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        name: "Aluguel Atualizado",
        description: "Nova descrição",
        repeat: RepeatEnum.REPEAT,
        balance: "2000.00",
        day: 10,
        month: MonthEnum.FEBRUARY,
      };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("name (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const input = { name: "a".repeat(64) };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const input = { name: "a".repeat(65) };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { name: undefined };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres", async () => {
      const input = { description: "a".repeat(256) };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const input = { description: "a".repeat(257) };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { description: undefined };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita null", async () => {
      const input = { description: null };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });
  });

  describe("repeat (opcional)", () => {
    it("aceita todos os valores do enum RepeatEnum", async () => {
      for (const repeat of Object.values(RepeatEnum)) {
        const input = { repeat };
        const errors = await validateInput(UpdatePaymentInput, input);
        expect(constraintsFor(errors, "repeat")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const input = { repeat: "INVALIDO" as unknown as RepeatEnum };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "repeat")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { repeat: undefined };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "repeat")).toHaveLength(0);
    });
  });

  describe("balance (opcional)", () => {
    it.each(["100.00", "0.00", "1,234.56", "50.00"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const input = { balance: value };
        const errors = await validateInput(UpdatePaymentInput, input);
        expect(constraintsFor(errors, "balance")).toHaveLength(0);
      }
    );

    it("rejeita valores negativos (allow_negatives: false)", async () => {
      const input = { balance: "-50.00" };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const input = { balance: value };
        const errors = await validateInput(UpdatePaymentInput, input);
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("aceita undefined (omitido)", async () => {
      const input = { balance: undefined };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "balance")).toHaveLength(0);
    });
  });

  describe("day (opcional)", () => {
    it("aceita 1 (valor mínimo)", async () => {
      const input = { day: 1 };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "day")).toHaveLength(0);
    });

    it("aceita 31 (valor máximo)", async () => {
      const input = { day: 31 };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "day")).toHaveLength(0);
    });

    it("rejeita 0 (menor que mínimo)", async () => {
      const input = { day: 0 };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "day")).toContain("min");
    });

    it("rejeita 32 (maior que máximo)", async () => {
      const input = { day: 32 };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "day")).toContain("max");
    });

    it("rejeita valor não inteiro", async () => {
      const input = { day: 10.5 as unknown as number };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "day")).toContain("isInt");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { day: undefined };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "day")).toHaveLength(0);
    });
  });

  describe("month (opcional)", () => {
    it("aceita todos os valores do enum MonthEnum", async () => {
      for (const month of Object.values(MonthEnum)) {
        const input = { month };
        const errors = await validateInput(UpdatePaymentInput, input);
        expect(constraintsFor(errors, "month")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const input = { month: "INVALIDO" as unknown as MonthEnum };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "month")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { month: undefined };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "month")).toHaveLength(0);
    });
  });

  describe("status (opcional)", () => {
    it("aceita todos os valores do enum PaymentEnum", async () => {
      for (const status of Object.values(PaymentEnum)) {
        const input = { status };
        const errors = await validateInput(UpdatePaymentInput, input);
        expect(constraintsFor(errors, "status")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const input = { status: "INVALIDO" as unknown as PaymentEnum };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "status")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { status: undefined };
      const errors = await validateInput(UpdatePaymentInput, input);
      expect(constraintsFor(errors, "status")).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const input = {
        name: "a".repeat(65),
        description: "a".repeat(257),
        repeat: "INVALIDO" as unknown as RepeatEnum,
        balance: "-10.00",
        day: 0,
        month: "INVALIDO" as unknown as MonthEnum,
        status: "INVALIDO" as unknown as PaymentEnum,
      };
      const errors = await validateInput(UpdatePaymentInput, input);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        [
          "balance",
          "day",
          "description",
          "month",
          "name",
          "repeat",
          "status",
        ].sort()
      );
    });
  });
});

import "reflect-metadata";

import { validate, ValidationError } from "class-validator";
import { InvoiceStatusEnum } from "@/enums/InvoiceStatusEnum";
import { RepeatEnum } from "@/enums/RepeatEnum";
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoicePayInput,
  ListInvoiceInput,
} from "@/resolvers/invoice/InvoiceInputs";

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
// CreateInvoiceInput
// ============================================================
describe("CreateInvoiceInput", () => {
  const validPayload = {
    bankId: "550e8400-e29b-41d4-a716-446655440000",
    name: "Fatura de Luz",
    description: "Conta de luz - vencimento 10/08",
    repeat: RepeatEnum.NO_REPEAT,
    installments: 1,
    balance: "150.00",
    total: "150.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(CreateInvoiceInput, validPayload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com description omitida (opcional)", async () => {
      const { description, ...payload } = validPayload;
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com description null", async () => {
      const payload = { ...validPayload, description: null };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("bankId", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        bankId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const payload = {
        ...validPayload,
        bankId: "550e8400-e29b-11d4-a716-446655440000",
      };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const payload = { ...validPayload, bankId: "nao-e-uuid" };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });
  });

  describe("name", () => {
    it("aceita exatamente 64 caracteres (limite)", async () => {
      const payload = { ...validPayload, name: "a".repeat(64) };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres (acima do limite)", async () => {
      const payload = { ...validPayload, name: "a".repeat(65) };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { name, ...payload } = validPayload;
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        name: null,
      } as unknown as CreateInvoiceInput;
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres (limite)", async () => {
      const payload = { ...validPayload, description: "a".repeat(256) };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres (acima do limite)", async () => {
      const payload = { ...validPayload, description: "a".repeat(257) };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, description: null };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const { description, ...payload } = validPayload;
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });
  });

  describe("repeat", () => {
    it("aceita todos os valores do enum RepeatEnum", async () => {
      for (const repeat of Object.values(RepeatEnum)) {
        const payload = { ...validPayload, repeat };
        const errors = await validateInput(CreateInvoiceInput, payload);
        expect(constraintsFor(errors, "repeat")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const payload = {
        ...validPayload,
        repeat: "INVALIDO" as unknown as RepeatEnum,
      };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "repeat")).toContain("isEnum");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { repeat, ...payload } = validPayload;
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "repeat")).toContain("isEnum");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        repeat: null,
      } as unknown as CreateInvoiceInput;
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "repeat")).toContain("isEnum");
    });
  });

  describe("installments", () => {
    it("aceita 1 (valor mínimo)", async () => {
      const payload = { ...validPayload, installments: 1 };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "installments")).toHaveLength(0);
    });

    it("aceita valor maior que 1", async () => {
      const payload = { ...validPayload, installments: 12 };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "installments")).toHaveLength(0);
    });

    it("rejeita 0 (menor que mínimo)", async () => {
      const payload = { ...validPayload, installments: 0 };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "installments")).toContain("min");
    });

    it("rejeita valor negativo", async () => {
      const payload = { ...validPayload, installments: -1 };
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "installments")).toContain("min");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { installments, ...payload } = validPayload;
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "installments")).toContain("min");
    });
  });

  describe("balance", () => {
    it.each(["100.00", "0.00", "1,234.56", "-50.00", "100"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const payload = { ...validPayload, balance: value };
        const errors = await validateInput(CreateInvoiceInput, payload);
        expect(constraintsFor(errors, "balance")).toHaveLength(0);
      }
    );

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const payload = { ...validPayload, balance: value };
        const errors = await validateInput(CreateInvoiceInput, payload);
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { balance, ...payload } = validPayload;
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("total", () => {
    it.each(["100.00", "0.00", "1,234.56", "-50.00", "100"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const payload = { ...validPayload, total: value };
        const errors = await validateInput(CreateInvoiceInput, payload);
        expect(constraintsFor(errors, "total")).toHaveLength(0);
      }
    );

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const payload = { ...validPayload, total: value };
        const errors = await validateInput(CreateInvoiceInput, payload);
        expect(constraintsFor(errors, "total")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { total, ...payload } = validPayload;
      const errors = await validateInput(CreateInvoiceInput, payload);
      expect(constraintsFor(errors, "total")).toContain("isCurrency");
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        bankId: "uuid-invalido",
        name: "a".repeat(65),
        repeat: "INVALIDO" as unknown as RepeatEnum,
        installments: 0,
        balance: "inválido",
        total: "inválido",
      };
      const errors = await validateInput(CreateInvoiceInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["balance", "bankId", "installments", "name", "repeat", "total"].sort()
      );
    });
  });
});

// ============================================================
// UpdateInvoiceInput
// ============================================================
describe("UpdateInvoiceInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos os campos opcionais)", async () => {
      const errors = await validateInput(UpdateInvoiceInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        name: "Fatura Atualizada",
        description: "Nova descrição",
      };
      const errors = await validateInput(UpdateInvoiceInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("name (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const input = { name: "a".repeat(64) };
      const errors = await validateInput(UpdateInvoiceInput, input);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const input = { name: "a".repeat(65) };
      const errors = await validateInput(UpdateInvoiceInput, input);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("aceita null", async () => {
      const input = { description: null } as unknown as UpdateInvoiceInput;
      const errors = await validateInput(UpdateInvoiceInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const input = { name: undefined } as unknown as UpdateInvoiceInput;
      const errors = await validateInput(UpdateInvoiceInput, input);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres", async () => {
      const input = { description: "a".repeat(256) };
      const errors = await validateInput(UpdateInvoiceInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const input = { description: "a".repeat(257) };
      const errors = await validateInput(UpdateInvoiceInput, input);
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null", async () => {
      const input = { description: null };
      const errors = await validateInput(UpdateInvoiceInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const input = { description: undefined };
      const errors = await validateInput(UpdateInvoiceInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de campos diferentes", async () => {
      const input = {
        name: "a".repeat(65),
        description: "a".repeat(257),
      };
      const errors = await validateInput(UpdateInvoiceInput, input);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(["description", "name"].sort());
    });
  });
});

// ============================================================
// InvoicePayInput
// ============================================================
describe("InvoicePayInput", () => {
  const validPayload = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    bankId: "550e8400-e29b-41d4-a716-446655440000",
    payInvoice: true,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(InvoicePayInput, validPayload);
      expect(errors).toHaveLength(0);
    });

    it("aceita payInvoice como false", async () => {
      const payload = { ...validPayload, payInvoice: false };
      const errors = await validateInput(InvoicePayInput, payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("id", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        id: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(InvoicePayInput, payload);
      expect(constraintsFor(errors, "id")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const payload = {
        ...validPayload,
        id: "550e8400-e29b-11d4-a716-446655440000",
      };
      const errors = await validateInput(InvoicePayInput, payload);
      expect(constraintsFor(errors, "id")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const payload = { ...validPayload, id: "nao-e-uuid" };
      const errors = await validateInput(InvoicePayInput, payload);
      expect(constraintsFor(errors, "id")).toContain("isUuid");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { id, ...payload } = validPayload;
      const errors = await validateInput(InvoicePayInput, payload);
      expect(constraintsFor(errors, "id")).toContain("isUuid");
    });
  });

  describe("bankId", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        bankId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(InvoicePayInput, payload);
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const payload = {
        ...validPayload,
        bankId: "550e8400-e29b-11d4-a716-446655440000",
      };
      const errors = await validateInput(InvoicePayInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const payload = { ...validPayload, bankId: "nao-e-uuid" };
      const errors = await validateInput(InvoicePayInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { bankId, ...payload } = validPayload;
      const errors = await validateInput(InvoicePayInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });
  });

  describe("payInvoice", () => {
    it("aceita true", async () => {
      const payload = { ...validPayload, payInvoice: true };
      const errors = await validateInput(InvoicePayInput, payload);
      expect(constraintsFor(errors, "payInvoice")).toHaveLength(0);
    });

    it("aceita false", async () => {
      const payload = { ...validPayload, payInvoice: false };
      const errors = await validateInput(InvoicePayInput, payload);
      expect(constraintsFor(errors, "payInvoice")).toHaveLength(0);
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { payInvoice, ...payload } = validPayload;
      const errors = await validateInput(InvoicePayInput, payload);

      const error = errors.find((e) => e.property === "payInvoice");
      expect(error?.constraints).toHaveProperty("isBoolean");
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de campos diferentes", async () => {
      const payload = {
        id: "invalido",
        bankId: "invalido",
        payInvoice: undefined,
      };
      const errors = await validateInput(InvoicePayInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(["bankId", "id", "payInvoice"].sort());
    });
  });
});

// ============================================================
// ListInvoiceInput
// ============================================================
describe("ListInvoiceInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos os campos opcionais)", async () => {
      const errors = await validateInput(ListInvoiceInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        limit: 10,
        offset: 0,
        status: InvoiceStatusEnum.ACTIVE,
        repeat: RepeatEnum.NO_REPEAT,
      };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("limit", () => {
    it("aceita 0", async () => {
      const input = { limit: 0 };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const input = { limit: 5 };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const input = { limit: 10.5 as unknown as number };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "limit")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const input = { limit: -1 };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "limit")).toContain("min");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { limit: undefined };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });
  });

  describe("offset", () => {
    it("aceita 0", async () => {
      const input = { offset: 0 };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const input = { offset: 2 };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const input = { offset: 1.5 as unknown as number };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "offset")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const input = { offset: -1 };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "offset")).toContain("min");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { offset: undefined };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });
  });

  describe("status (opcional)", () => {
    it("aceita todos os valores do enum InvoiceStatusEnum", async () => {
      for (const status of Object.values(InvoiceStatusEnum)) {
        const input = { status };
        const errors = await validateInput(ListInvoiceInput, input);
        expect(constraintsFor(errors, "status")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const input = { status: "INVALIDO" as unknown as InvoiceStatusEnum };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "status")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { status: undefined };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "status")).toHaveLength(0);
    });
  });

  describe("repeat (opcional)", () => {
    it("aceita todos os valores do enum RepeatEnum", async () => {
      for (const repeat of Object.values(RepeatEnum)) {
        const input = { repeat };
        const errors = await validateInput(ListInvoiceInput, input);
        expect(constraintsFor(errors, "repeat")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const input = { repeat: "INVALIDO" as unknown as RepeatEnum };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "repeat")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { repeat: undefined };
      const errors = await validateInput(ListInvoiceInput, input);
      expect(constraintsFor(errors, "repeat")).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const input = {
        limit: -1,
        offset: -1,
        status: "INVALIDO" as unknown as InvoiceStatusEnum,
        repeat: "INVALIDO" as unknown as RepeatEnum,
      };
      const errors = await validateInput(ListInvoiceInput, input);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["limit", "offset", "repeat", "status"].sort()
      );
    });
  });
});

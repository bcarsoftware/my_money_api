import "reflect-metadata";

import { validate, ValidationError } from "class-validator";
import {
  CreateBankBoxInput,
  ListBankBoxInput,
  UpdateBankBoxInput,
} from "@/resolvers/bank-box/BankBoxInputs";

// Helper para validar instâncias
async function validateInput<T extends object>(
  Ctor: new () => T,
  plain: Partial<T>
): Promise<ValidationError[]> {
  const instance = Object.assign(new Ctor(), plain);
  return validate(instance);
}

// Helper para obter as constraints de um campo específico
function constraintsFor(errors: ValidationError[], property: string): string[] {
  const error = errors.find((e) => e.property === property);
  return error?.constraints ? Object.keys(error.constraints) : [];
}

// ============================================================
// CreateBankBoxInput
// ============================================================
describe("CreateBankBoxInput", () => {
  const validPayload = {
    bankId: "550e8400-e29b-41d4-a716-446655440000",
    tag: "Minha Caixa",
    objective: "1000.00",
    description: "Descrição da caixa",
    balance: "5000.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(CreateBankBoxInput, validPayload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com campos opcionais (objective, description) omitidos", async () => {
      const { objective, description, ...payload } = validPayload;
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("bankId", () => {
    it("aceita um UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        bankId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const payload = {
        ...validPayload,
        bankId: "550e8400-e29b-11d4-a716-446655440000",
      };
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita string que não é UUID", async () => {
      const payload = { ...validPayload, bankId: "nao-e-uuid" };
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita string vazia", async () => {
      const payload = { ...validPayload, bankId: "" };
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { bankId, ...payload } = validPayload;
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });
  });

  describe("tag", () => {
    it("aceita exatamente 64 caracteres (limite)", async () => {
      const payload = { ...validPayload, tag: "a".repeat(64) };
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres (acima do limite)", async () => {
      const payload = { ...validPayload, tag: "a".repeat(65) };
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { tag, ...payload } = validPayload;
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });
  });

  describe("objective (opcional)", () => {
    it("é opcional — ausência não gera erro", async () => {
      const { objective, ...payload } = validPayload;
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("aceita null explicitamente", async () => {
      const payload = { ...validPayload, objective: null };
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("rejeita formato de moeda inválido", async () => {
      const payload = { ...validPayload, objective: "inválido" };
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "objective")).toContain("isCurrency");
    });

    it("aceita formato de moeda válido", async () => {
      const payload = { ...validPayload, objective: "1,234.56" };
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });
  });

  describe("description (opcional)", () => {
    it("é opcional — ausência não gera erro", async () => {
      const { description, ...payload } = validPayload;
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita null explicitamente", async () => {
      const payload = { ...validPayload, description: null };
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita exatamente 256 caracteres (limite)", async () => {
      const payload = { ...validPayload, description: "a".repeat(256) };
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres (acima do limite)", async () => {
      const payload = { ...validPayload, description: "a".repeat(257) };
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });
  });

  describe("balance", () => {
    it.each(["100.00", "0.00", "1,234.56", "-50.00", "100"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const payload = { ...validPayload, balance: value };
        const errors = await validateInput(CreateBankBoxInput, payload);
        expect(constraintsFor(errors, "balance")).toHaveLength(0);
      }
    );

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const payload = { ...validPayload, balance: value };
        const errors = await validateInput(CreateBankBoxInput, payload);
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { balance, ...payload } = validPayload;
      const errors = await validateInput(CreateBankBoxInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        bankId: "uuid-invalido",
        tag: "a".repeat(65),
        objective: "inválido",
        description: "a".repeat(257),
        balance: "inválido",
      };
      const errors = await validateInput(CreateBankBoxInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["balance", "bankId", "description", "objective", "tag"].sort()
      );
    });
  });
});

// ============================================================
// ListBankBoxInput
// ============================================================
describe("ListBankBoxInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos os campos opcionais)", async () => {
      const errors = await validateInput(ListBankBoxInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        limit: 10,
        offset: 0,
        bankId: "550e8400-e29b-41d4-a716-446655440000",
        tag: "caixa",
      };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("limit", () => {
    it("aceita 0", async () => {
      const input = { limit: 0 };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const input = { limit: 5 };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const input = { limit: 10.5 as unknown as number };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "limit")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const input = { limit: -1 };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "limit")).toContain("min");
    });
  });

  describe("offset", () => {
    it("aceita 0", async () => {
      const input = { offset: 0 };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const input = { offset: 2 };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const input = { offset: 1.5 as unknown as number };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "offset")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const input = { offset: -1 };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "offset")).toContain("min");
    });
  });

  describe("bankId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const input = { bankId: "550e8400-e29b-41d4-a716-446655440000" };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente", async () => {
      const input = { bankId: "550e8400-e29b-11d4-a716-446655440000" };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const input = { bankId: "nao-e-uuid" };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { bankId: undefined };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });
  });

  describe("tag (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const input = { tag: "a".repeat(64) };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const input = { tag: "a".repeat(65) };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { tag: undefined };
      const errors = await validateInput(ListBankBoxInput, input);
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de campos diferentes", async () => {
      const input = {
        limit: -1,
        offset: -1,
        bankId: "invalido",
        tag: "a".repeat(65),
      };
      const errors = await validateInput(ListBankBoxInput, input);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(["bankId", "limit", "offset", "tag"].sort());
    });
  });
});

// ============================================================
// UpdateBankBoxInput
// ============================================================
describe("UpdateBankBoxInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos os campos opcionais)", async () => {
      const errors = await validateInput(UpdateBankBoxInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        bankId: "550e8400-e29b-41d4-a716-446655440000",
        tag: "Tag atualizada",
        objective: "2000.00",
        description: "Nova descrição",
        balance: "10000.00",
      };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("bankId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const input = { bankId: "550e8400-e29b-41d4-a716-446655440000" };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente", async () => {
      const input = { bankId: "550e8400-e29b-11d4-a716-446655440000" };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const input = { bankId: "nao-e-uuid" };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { bankId: undefined };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });
  });

  describe("tag (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const input = { tag: "a".repeat(64) };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const input = { tag: "a".repeat(65) };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { tag: undefined };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });
  });

  describe("objective (opcional)", () => {
    it("é opcional — omitido não gera erro", async () => {
      const input = { objective: undefined };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("aceita null", async () => {
      const input = { objective: null };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("aceita formato de moeda válido", async () => {
      const input = { objective: "500.75" };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("rejeita formato de moeda inválido", async () => {
      const input = { objective: "inválido" };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "objective")).toContain("isCurrency");
    });
  });

  describe("description (opcional)", () => {
    it("é opcional — omitido não gera erro", async () => {
      const input = { description: undefined };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita null", async () => {
      const input = { description: null };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita exatamente 256 caracteres", async () => {
      const input = { description: "a".repeat(256) };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const input = { description: "a".repeat(257) };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });
  });

  describe("balance (opcional)", () => {
    it("é opcional — omitido não gera erro", async () => {
      const input = { balance: undefined };
      const errors = await validateInput(UpdateBankBoxInput, input);
      expect(constraintsFor(errors, "balance")).toHaveLength(0);
    });

    it.each(["100.00", "0.00", "1,234.56", "-50.00"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const input = { balance: value };
        const errors = await validateInput(UpdateBankBoxInput, input);
        expect(constraintsFor(errors, "balance")).toHaveLength(0);
      }
    );

    it.each(["não é moeda", "", "100.5"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const input = { balance: value };
        const errors = await validateInput(UpdateBankBoxInput, input);
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );
  });

  describe("múltiplos erros", () => {
    it("acumula erros de campos diferentes", async () => {
      const input = {
        bankId: "invalido",
        tag: "a".repeat(65),
        objective: "inválido",
        description: "a".repeat(257),
        balance: "inválido",
      };
      const errors = await validateInput(UpdateBankBoxInput, input);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["balance", "bankId", "description", "objective", "tag"].sort()
      );
    });
  });
});

import "reflect-metadata";

import { validate, ValidationError } from "class-validator";
import {
  CreateGenericBankBoxInput,
  ListGenericBankBoxInput,
  UpdateGenericBankBoxInput,
} from "@/resolvers/generic-bank-box/GenericBankBoxInputs";

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
// CreateGenericBankBoxInput
// ============================================================
describe("CreateGenericBankBoxInput", () => {
  const validPayload = {
    genericBankId: "550e8400-e29b-41d4-a716-446655440000",
    name: "Caixa Principal",
    objective: "1000.00",
    description: "Descrição da caixa",
    balance: "5000.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(
        CreateGenericBankBoxInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com objective e description omitidos (opcionais)", async () => {
      const { objective, description, ...payload } = validPayload;
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com objective e description null", async () => {
      const payload = { ...validPayload, objective: null, description: null };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("genericBankId", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        genericBankId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "genericBankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const payload = {
        ...validPayload,
        genericBankId: "550e8400-e29b-11d4-a716-446655440000",
      };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const payload = { ...validPayload, genericBankId: "nao-e-uuid" };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { genericBankId, ...payload } = validPayload;
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        genericBankId: null,
      } as unknown as CreateGenericBankBoxInput;
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });
  });

  describe("name", () => {
    it("aceita exatamente 64 caracteres (limite)", async () => {
      const payload = { ...validPayload, name: "a".repeat(64) };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres (acima do limite)", async () => {
      const payload = { ...validPayload, name: "a".repeat(65) };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { name, ...payload } = validPayload;
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        name: null,
      } as unknown as CreateGenericBankBoxInput;
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });
  });

  describe("objective (opcional)", () => {
    it("é opcional — ausência não gera erro", async () => {
      const { objective, ...payload } = validPayload;
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, objective: null };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("aceita formato de moeda válido (sem valores negativos)", async () => {
      const payload = { ...validPayload, objective: "100.00" };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("rejeita valores negativos (allow_negatives: false)", async () => {
      const payload = { ...validPayload, objective: "-50.00" };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "objective")).toContain("isCurrency");
    });

    it("rejeita formato de moeda inválido", async () => {
      const payload = { ...validPayload, objective: "inválido" };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "objective")).toContain("isCurrency");
    });
  });

  describe("description (opcional)", () => {
    it("é opcional — ausência não gera erro", async () => {
      const { description, ...payload } = validPayload;
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, description: null };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita exatamente 256 caracteres (limite)", async () => {
      const payload = { ...validPayload, description: "a".repeat(256) };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres (acima do limite)", async () => {
      const payload = { ...validPayload, description: "a".repeat(257) };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });
  });

  describe("balance", () => {
    it.each(["100.00", "0.00", "1,234.56", "50.00"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const payload = { ...validPayload, balance: value };
        const errors = await validateInput(CreateGenericBankBoxInput, payload);
        expect(constraintsFor(errors, "balance")).toHaveLength(0);
      }
    );

    it("rejeita valores negativos (allow_negatives: false)", async () => {
      const payload = { ...validPayload, balance: "-50.00" };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const payload = { ...validPayload, balance: value };
        const errors = await validateInput(CreateGenericBankBoxInput, payload);
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { balance, ...payload } = validPayload;
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        balance: null,
      } as unknown as CreateGenericBankBoxInput;
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        genericBankId: "uuid-invalido",
        name: "a".repeat(65),
        objective: "-50.00",
        description: "a".repeat(257),
        balance: "-10.00",
      };
      const errors = await validateInput(CreateGenericBankBoxInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["balance", "description", "genericBankId", "name", "objective"].sort()
      );
    });
  });
});

// ============================================================
// ListGenericBankBoxInput
// ============================================================
describe("ListGenericBankBoxInput", () => {
  describe("caminho feliz", () => {
    it("retorna erro com objeto vazio (todos os campos opcionais)", async () => {
      const errors = await validateInput(ListGenericBankBoxInput, {});
      expect(errors).toHaveLength(1);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        limit: 10,
        offset: 0,
        genericBankId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Caixa",
      };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("limit", () => {
    it("aceita 0", async () => {
      const input = { limit: 0 };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const input = { limit: 5 };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const input = { limit: 10.5 as unknown as number };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "limit")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const input = { limit: -1 };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "limit")).toContain("min");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { limit: undefined };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });
  });

  describe("offset", () => {
    it("aceita 0", async () => {
      const input = { offset: 0 };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const input = { offset: 2 };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const input = { offset: 1.5 as unknown as number };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "offset")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const input = { offset: -1 };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "offset")).toContain("min");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { offset: undefined };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });
  });

  describe("genericBankId (obrigatório)", () => {
    it("aceita UUID v4 válido", async () => {
      const input = { genericBankId: "550e8400-e29b-41d4-a716-446655440000" };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "genericBankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const input = { genericBankId: "550e8400-e29b-11d4-a716-446655440000" };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const input = { genericBankId: "nao-e-uuid" };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { genericBankId, ...input } = {
        genericBankId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const input = {
        genericBankId: null,
      } as unknown as ListGenericBankBoxInput;
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });
  });

  describe("name (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const input = { name: "a".repeat(64) };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const input = { name: "a".repeat(65) };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { name: undefined };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const input = {
        limit: -1,
        offset: -1,
        genericBankId: "uuid-invalido",
        name: "a".repeat(65),
      };
      const errors = await validateInput(ListGenericBankBoxInput, input);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["genericBankId", "limit", "name", "offset"].sort()
      );
    });
  });
});

// ============================================================
// UpdateGenericBankBoxInput
// ============================================================
describe("UpdateGenericBankBoxInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos os campos opcionais)", async () => {
      const errors = await validateInput(UpdateGenericBankBoxInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        name: "Caixa Atualizada",
        objective: "2000.00",
        description: "Nova descrição",
        balance: "10000.00",
      };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("name (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const input = { name: "a".repeat(64) };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const input = { name: "a".repeat(65) };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { name: undefined };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });
  });

  describe("objective (opcional)", () => {
    it("é opcional — omitido não gera erro", async () => {
      const input = { objective: undefined };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("aceita null", async () => {
      const input = { objective: null };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("aceita formato de moeda válido", async () => {
      const input = { objective: "500.75" };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("rejeita valores negativos", async () => {
      const input = { objective: "-50.00" };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "objective")).toContain("isCurrency");
    });

    it("rejeita formato de moeda inválido", async () => {
      const input = { objective: "inválido" };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "objective")).toContain("isCurrency");
    });
  });

  describe("description (opcional)", () => {
    it("é opcional — omitido não gera erro", async () => {
      const input = { description: undefined };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita null", async () => {
      const input = { description: null };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita exatamente 256 caracteres", async () => {
      const input = { description: "a".repeat(256) };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const input = { description: "a".repeat(257) };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });
  });

  describe("balance (opcional)", () => {
    it("é opcional — omitido não gera erro", async () => {
      const input = { balance: undefined };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "balance")).toHaveLength(0);
    });

    it.each(["100.00", "0.00", "1,234.56", "50.00"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const input = { balance: value };
        const errors = await validateInput(UpdateGenericBankBoxInput, input);
        expect(constraintsFor(errors, "balance")).toHaveLength(0);
      }
    );

    it("rejeita valores negativos", async () => {
      const input = { balance: "-50.00" };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it.each(["não é moeda", "", "100.5"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const input = { balance: value };
        const errors = await validateInput(UpdateGenericBankBoxInput, input);
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const input = {
        name: "a".repeat(65),
        objective: "-50.00",
        description: "a".repeat(257),
        balance: "-10.00",
      };
      const errors = await validateInput(UpdateGenericBankBoxInput, input);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["balance", "description", "name", "objective"].sort()
      );
    });
  });
});

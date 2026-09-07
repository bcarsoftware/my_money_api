import "reflect-metadata";

import { validate, ValidationError } from "class-validator";
import { CurrencyEnum } from "@/enums/CurrencyEnum";
import {
  CreateBankInfoInput,
  CreateGenericBankInput,
  ListGenericBankInput,
  UpdateBankInfoInput,
  UpdateGenericBankInput,
} from "@/resolvers/generic-bank/GenericBankInputs";

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
// CreateBankInfoInput
// ============================================================
describe("CreateBankInfoInput", () => {
  const validPayload = {
    name: "Chave",
    value: "Valor",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(CreateBankInfoInput, validPayload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("name", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const payload = { ...validPayload, name: "a".repeat(64) };
      const errors = await validateInput(CreateBankInfoInput, payload);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const payload = { ...validPayload, name: "a".repeat(65) };
      const errors = await validateInput(CreateBankInfoInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { name, ...payload } = validPayload;
      const errors = await validateInput(CreateBankInfoInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        name: null,
      } as unknown as CreateBankInfoInput;
      const errors = await validateInput(CreateBankInfoInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });
  });

  describe("value", () => {
    it("aceita exatamente 256 caracteres", async () => {
      const payload = { ...validPayload, value: "a".repeat(256) };
      const errors = await validateInput(CreateBankInfoInput, payload);
      expect(constraintsFor(errors, "value")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const payload = { ...validPayload, value: "a".repeat(257) };
      const errors = await validateInput(CreateBankInfoInput, payload);
      expect(constraintsFor(errors, "value")).toContain("maxLength");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { value, ...payload } = validPayload;
      const errors = await validateInput(CreateBankInfoInput, payload);
      expect(constraintsFor(errors, "value")).toContain("maxLength");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        value: null,
      } as unknown as CreateBankInfoInput;
      const errors = await validateInput(CreateBankInfoInput, payload);
      expect(constraintsFor(errors, "value")).toContain("maxLength");
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        name: "a".repeat(65),
        value: "a".repeat(257),
      };
      const errors = await validateInput(CreateBankInfoInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(["name", "value"].sort());
    });
  });
});

// ============================================================
// UpdateBankInfoInput
// ============================================================
describe("UpdateBankInfoInput", () => {
  const validPayload = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Chave Atualizada",
    value: "Valor Atualizado",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(UpdateBankInfoInput, validPayload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("id", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        id: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "id")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const payload = {
        ...validPayload,
        id: "550e8400-e29b-11d4-a716-446655440000",
      };
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "id")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const payload = { ...validPayload, id: "nao-e-uuid" };
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "id")).toContain("isUuid");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { id, ...payload } = validPayload;
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "id")).toContain("isUuid");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        id: null,
      } as unknown as UpdateBankInfoInput;
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "id")).toContain("isUuid");
    });
  });

  describe("name", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const payload = { ...validPayload, name: "a".repeat(64) };
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const payload = { ...validPayload, name: "a".repeat(65) };
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { name, ...payload } = validPayload;
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        name: null,
      } as unknown as UpdateBankInfoInput;
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });
  });

  describe("value", () => {
    it("aceita exatamente 256 caracteres", async () => {
      const payload = { ...validPayload, value: "a".repeat(256) };
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "value")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const payload = { ...validPayload, value: "a".repeat(257) };
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "value")).toContain("maxLength");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { value, ...payload } = validPayload;
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "value")).toContain("maxLength");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...validPayload,
        value: null,
      } as unknown as UpdateBankInfoInput;
      const errors = await validateInput(UpdateBankInfoInput, payload);
      expect(constraintsFor(errors, "value")).toContain("maxLength");
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        id: "uuid-invalido",
        name: "a".repeat(65),
        value: "a".repeat(257),
      };
      const errors = await validateInput(UpdateBankInfoInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(["id", "name", "value"].sort());
    });
  });
});

// ============================================================
// CreateGenericBankInput
// ============================================================
describe("CreateGenericBankInput", () => {
  const basePayload = {
    bankId: "550e8400-e29b-41d4-a716-446655440000",
    name: "Banco Genérico",
    currency: CurrencyEnum.BRL,
    balance: "1000.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com campos obrigatórios válidos (bankInfo omitido)", async () => {
      const errors = await validateInput(CreateGenericBankInput, basePayload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com bankInfo: [] (array vazio)", async () => {
      const payload = { ...basePayload, bankInfo: [] };
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com bankInfo: null (graças ao @IsOptional)", async () => {
      const payload = { ...basePayload, bankInfo: null };
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("bankId", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...basePayload,
        bankId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const payload = {
        ...basePayload,
        bankId: "550e8400-e29b-11d4-a716-446655440000",
      };
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const payload = { ...basePayload, bankId: "nao-e-uuid" };
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { bankId, ...payload } = basePayload;
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...basePayload,
        bankId: null,
      } as unknown as CreateGenericBankInput;
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });
  });

  describe("name", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const payload = { ...basePayload, name: "a".repeat(64) };
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const payload = { ...basePayload, name: "a".repeat(65) };
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { name, ...payload } = basePayload;
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...basePayload,
        name: null,
      } as unknown as CreateGenericBankInput;
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });
  });

  describe("currency", () => {
    it("aceita todos os valores do enum", async () => {
      for (const currency of Object.values(CurrencyEnum)) {
        const payload = { ...basePayload, currency };
        const errors = await validateInput(CreateGenericBankInput, payload);
        expect(constraintsFor(errors, "currency")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const payload = {
        ...basePayload,
        currency: "INVALIDO" as unknown as CurrencyEnum,
      };
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "currency")).toContain("isEnum");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { currency, ...payload } = basePayload;
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "currency")).toContain("isEnum");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...basePayload,
        currency: null,
      } as unknown as CreateGenericBankInput;
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "currency")).toContain("isEnum");
    });
  });

  describe("balance", () => {
    it.each(["100.00", "0.00", "1,234.56", "50.00"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const payload = { ...basePayload, balance: value };
        const errors = await validateInput(CreateGenericBankInput, payload);
        expect(constraintsFor(errors, "balance")).toHaveLength(0);
      }
    );

    it("rejeita valores negativos (allow_negatives: false)", async () => {
      const payload = { ...basePayload, balance: "-50.00" };
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const payload = { ...basePayload, balance: value };
        const errors = await validateInput(CreateGenericBankInput, payload);
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { balance, ...payload } = basePayload;
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita null (campo obrigatório)", async () => {
      const payload = {
        ...basePayload,
        balance: null,
      } as unknown as CreateGenericBankInput;
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("bankInfo (opcional – comportamento real)", () => {
    it("falha ao validar objetos dentro de bankInfo (unknownValue)", async () => {
      const payload = {
        ...basePayload,
        bankInfo: [{ name: "Chave", value: "Valor" }],
      };
      const errors = await validateInput(CreateGenericBankInput, payload);
      const bankInfoError = errors.find((e) => e.property === "bankInfo");
      expect(bankInfoError).toBeDefined();
      expect(bankInfoError!.children?.length).toBeGreaterThan(0);
      const childError = bankInfoError!.children?.[0];
      expect(childError).toBeDefined();
    });

    it("aceita null (devido ao @IsOptional)", async () => {
      const payload = { ...basePayload, bankInfo: null };
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(errors).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const payload = { ...basePayload };
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(errors).toHaveLength(0);
    });

    it("aceita array vazio", async () => {
      const payload = { ...basePayload, bankInfo: [] };
      const errors = await validateInput(CreateGenericBankInput, payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros dos campos obrigatórios e de bankInfo", async () => {
      const payload = {
        bankId: "uuid-invalido",
        name: "a".repeat(65),
        currency: "INVALIDO" as unknown as CurrencyEnum,
        balance: "-50.00",
        bankInfo: [{ name: "a".repeat(65), value: "Valor" }],
      };
      const errors = await validateInput(CreateGenericBankInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["balance", "bankId", "bankInfo", "currency", "name"].sort()
      );
    });
  });
});

// ============================================================
// ListGenericBankInput
// ============================================================
describe("ListGenericBankInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos opcionais)", async () => {
      const errors = await validateInput(ListGenericBankInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        limit: 10,
        offset: 0,
        bankId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Banco",
        currency: CurrencyEnum.BRL,
      };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("limit (opcional)", () => {
    it("aceita 0 (valor mínimo)", async () => {
      const input = { limit: 0 };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const input = { limit: 5 };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const input = { limit: 10.5 as unknown as number };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "limit")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const input = { limit: -1 };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "limit")).toContain("min");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { limit: undefined };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("offset (opcional)", () => {
    it("aceita 0 (valor mínimo)", async () => {
      const input = { offset: 0 };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const input = { offset: 2 };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const input = { offset: 1.5 as unknown as number };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "offset")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const input = { offset: -1 };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "offset")).toContain("min");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { offset: undefined };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("bankId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const input = { bankId: "550e8400-e29b-41d4-a716-446655440000" };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const input = { bankId: "550e8400-e29b-11d4-a716-446655440000" };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const input = { bankId: "nao-e-uuid" };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { bankId: undefined };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("name (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const input = { name: "a".repeat(64) };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const input = { name: "a".repeat(65) };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { name: undefined };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("currency (opcional)", () => {
    it("aceita todos os valores do enum", async () => {
      for (const currency of Object.values(CurrencyEnum)) {
        const input = { currency };
        const errors = await validateInput(ListGenericBankInput, input);
        expect(constraintsFor(errors, "currency")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const input = { currency: "INVALIDO" as unknown as CurrencyEnum };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(constraintsFor(errors, "currency")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { currency: undefined };
      const errors = await validateInput(ListGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const input = {
        limit: -1,
        offset: -1,
        bankId: "uuid-invalido",
        name: "a".repeat(65),
        currency: "INVALIDO" as unknown as CurrencyEnum,
      };
      const errors = await validateInput(ListGenericBankInput, input);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["bankId", "currency", "limit", "name", "offset"].sort()
      );
    });
  });
});

// ============================================================
// UpdateGenericBankInput
// ============================================================
describe("UpdateGenericBankInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos opcionais)", async () => {
      const errors = await validateInput(UpdateGenericBankInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com name válido e bankInfo omitido", async () => {
      const input = { name: "Banco Atualizado" };
      const errors = await validateInput(UpdateGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com bankInfo: null (graças ao @IsOptional)", async () => {
      const input = { bankInfo: null };
      const errors = await validateInput(UpdateGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com bankInfo: [] (array vazio)", async () => {
      const input = { bankInfo: [] };
      const errors = await validateInput(UpdateGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("name (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const input = { name: "a".repeat(64) };
      const errors = await validateInput(UpdateGenericBankInput, input);
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const input = { name: "a".repeat(65) };
      const errors = await validateInput(UpdateGenericBankInput, input);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { name: undefined };
      const errors = await validateInput(UpdateGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("bankInfo (opcional – comportamento real)", () => {
    it("falha ao validar objetos dentro de bankInfo (unknownValue)", async () => {
      const input = {
        bankInfo: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "Chave",
            value: "Valor",
          },
        ],
      };
      const errors = await validateInput(UpdateGenericBankInput, input);
      const bankInfoError = errors.find((e) => e.property === "bankInfo");
      expect(bankInfoError).toBeDefined();
      expect(bankInfoError!.children?.length).toBeGreaterThan(0);
      const childError = bankInfoError!.children?.[0];
      expect(childError).toBeDefined();
    });

    it("aceita null (devido ao @IsOptional)", async () => {
      const input = { bankInfo: null };
      const errors = await validateInput(UpdateGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const input = { bankInfo: undefined };
      const errors = await validateInput(UpdateGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });

    it("aceita array vazio", async () => {
      const input = { bankInfo: [] };
      const errors = await validateInput(UpdateGenericBankInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de name e bankInfo", async () => {
      const input = {
        name: "a".repeat(65),
        bankInfo: [{ id: "uuid-invalido", name: "Chave", value: "Valor" }],
      };
      const errors = await validateInput(UpdateGenericBankInput, input);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toContain("name");
      expect(properties).toContain("bankInfo");
    });
  });
});

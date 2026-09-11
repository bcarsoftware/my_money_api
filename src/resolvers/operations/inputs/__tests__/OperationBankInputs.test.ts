import "reflect-metadata";

import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import {
  CreateOperationBankInput,
  ListOperationBankInput,
  UpdateOperationBankInput,
} from "@/resolvers/operations/inputs/OperationBankInputs";
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
// CreateOperationBankInput
// ============================================================
describe("CreateOperationBankInput", () => {
  const validPayload = {
    bankId: "550e8400-e29b-41d4-a716-446655440000",
    bankBoxId: "550e8400-e29b-41d4-a716-446655440001",
    invoiceId: "550e8400-e29b-41d4-a716-446655440002",
    tag: "Compra",
    description: "Descrição qualquer",
    balance: "100.00",
    discount: "10.00",
    forfeit: "5.00",
    typeOperation: OperationEnum.PIX,
    local: LocalEnum.INTERNAL,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(
        CreateOperationBankInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com campos opcionais omitidos", async () => {
      const {
        bankBoxId,
        invoiceId,
        description,
        discount,
        forfeit,
        ...payload
      } = validPayload;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com campos opcionais definidos como null", async () => {
      const payload = {
        ...validPayload,
        bankBoxId: null,
        invoiceId: null,
        description: null,
        discount: null,
        forfeit: null,
      };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("bankId (obrigatório)", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        bankId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const payload = {
        ...validPayload,
        bankId: "550e8400-e29b-11d4-a716-446655440000",
      };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const payload = { ...validPayload, bankId: "nao-e-uuid" };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { bankId, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        bankId: null,
      } as unknown as CreateOperationBankInput;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });
  });

  describe("bankBoxId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        bankBoxId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "bankBoxId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const payload = {
        ...validPayload,
        bankBoxId: "550e8400-e29b-11d4-a716-446655440000",
      };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "bankBoxId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const payload = { ...validPayload, bankBoxId: "nao-e-uuid" };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "bankBoxId")).toContain("isUuid");
    });

    it("aceita undefined (omitido)", async () => {
      const { bankBoxId, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "bankBoxId")).toHaveLength(0);
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, bankBoxId: null };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "bankBoxId")).toHaveLength(0);
    });
  });

  describe("invoiceId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "invoiceId")).toHaveLength(0);
    });

    it("rejeita string não UUID", async () => {
      const payload = { ...validPayload, invoiceId: "nao-e-uuid" };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "invoiceId")).toContain("isUuid");
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, invoiceId: null };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "invoiceId")).toHaveLength(0);
    });
  });

  describe("tag (obrigatório)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const payload = { ...validPayload, tag: "a".repeat(64) };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const payload = { ...validPayload, tag: "a".repeat(65) };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("rejeita quando ausente", async () => {
      const { tag, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        tag: null,
      } as unknown as CreateOperationBankInput;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres", async () => {
      const payload = { ...validPayload, description: "a".repeat(256) };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const payload = { ...validPayload, description: "a".repeat(257) };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, description: null };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const { description, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });
  });

  describe("balance (obrigatório, permite negativos)", () => {
    it.each([
      "100.00",
      "0.00",
      "1,234.56",
      "50.00",
      "100",
      "-50.00",
      "-100.00",
    ])("aceita formato de moeda válido: %s", async (value) => {
      const payload = { ...validPayload, balance: value };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "balance")).toHaveLength(0);
    });

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const payload = { ...validPayload, balance: value };
        const errors = await validateInput(CreateOperationBankInput, payload);
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente", async () => {
      const { balance, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        balance: null,
      } as unknown as CreateOperationBankInput;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("discount (opcional, permite negativos)", () => {
    it.each(["100.00", "0.00", "-50.00", "1,234.56"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const payload = { ...validPayload, discount: value };
        const errors = await validateInput(CreateOperationBankInput, payload);
        expect(constraintsFor(errors, "discount")).toHaveLength(0);
      }
    );

    it("rejeita formato inválido", async () => {
      const payload = { ...validPayload, discount: "não é moeda" };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "discount")).toContain("isCurrency");
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, discount: null };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "discount")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const { discount, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "discount")).toHaveLength(0);
    });
  });

  describe("forfeit (opcional)", () => {
    it.each(["100.00", "0.00", "50.00"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const payload = { ...validPayload, forfeit: value };
        const errors = await validateInput(CreateOperationBankInput, payload);
        expect(constraintsFor(errors, "forfeit")).toHaveLength(0);
      }
    );

    it("rejeita valor negativo (allow_negatives padrão = false)", async () => {
      const payload = { ...validPayload, forfeit: "-50.00" };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "forfeit")).toContain("isCurrency");
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, forfeit: null };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "forfeit")).toHaveLength(0);
    });
  });

  describe("typeOperation (obrigatório)", () => {
    it("aceita todos os valores do enum OperationEnum", async () => {
      for (const value of Object.values(OperationEnum)) {
        const payload = { ...validPayload, typeOperation: value };
        const errors = await validateInput(CreateOperationBankInput, payload);
        expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const payload = {
        ...validPayload,
        typeOperation: "INVALIDO" as unknown as OperationEnum,
      };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });

    it("rejeita quando ausente", async () => {
      const { typeOperation, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        typeOperation: null,
      } as unknown as CreateOperationBankInput;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });
  });

  describe("local (obrigatório)", () => {
    it("aceita todos os valores do enum LocalEnum", async () => {
      for (const value of Object.values(LocalEnum)) {
        const payload = { ...validPayload, local: value };
        const errors = await validateInput(CreateOperationBankInput, payload);
        expect(constraintsFor(errors, "local")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const payload = {
        ...validPayload,
        local: "INVALIDO" as unknown as LocalEnum,
      };
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });

    it("rejeita quando ausente", async () => {
      const { local, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        local: null,
      } as unknown as CreateOperationBankInput;
      const errors = await validateInput(CreateOperationBankInput, payload);
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        bankId: "uuid-invalido",
        tag: "a".repeat(65),
        balance: "-10.00x",
        typeOperation: "INVALIDO" as unknown as OperationEnum,
        local: "INVALIDO" as unknown as LocalEnum,
      };
      const errors = await validateInput(CreateOperationBankInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["balance", "bankId", "local", "tag", "typeOperation"].sort()
      );
    });
  });
});

// ============================================================
// UpdateOperationBankInput
// ============================================================
describe("UpdateOperationBankInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos opcionais)", async () => {
      const errors = await validateInput(UpdateOperationBankInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        tag: "Compra",
        description: "Descrição atualizada",
      };
      const errors = await validateInput(UpdateOperationBankInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("tag (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const input = { tag: "a".repeat(64) };
      const errors = await validateInput(UpdateOperationBankInput, input);
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const input = { tag: "a".repeat(65) };
      const errors = await validateInput(UpdateOperationBankInput, input);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { tag: undefined };
      const errors = await validateInput(UpdateOperationBankInput, input);
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres", async () => {
      const input = { description: "a".repeat(256) };
      const errors = await validateInput(UpdateOperationBankInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const input = { description: "a".repeat(257) };
      const errors = await validateInput(UpdateOperationBankInput, input);
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null", async () => {
      const input = {
        description: null,
      } as unknown as UpdateOperationBankInput;
      const errors = await validateInput(UpdateOperationBankInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const input = { description: undefined };
      const errors = await validateInput(UpdateOperationBankInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const input = {
        tag: "a".repeat(65),
        description: "a".repeat(257),
      };
      const errors = await validateInput(UpdateOperationBankInput, input);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(["description", "tag"].sort());
    });
  });
});

// ============================================================
// ListOperationBankInput
// ============================================================
describe("ListOperationBankInput", () => {
  const validPayload = {
    limit: 10,
    offset: 0,
    bankId: "550e8400-e29b-41d4-a716-446655440000",
    bankBoxId: "550e8400-e29b-41d4-a716-446655440001",
    invoiceId: "550e8400-e29b-41d4-a716-446655440002",
    tag: "Compra",
    typeOperation: OperationEnum.PIX,
    local: LocalEnum.INTERNAL,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    minAmount: "100.00",
    maxAmount: "1000.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(ListOperationBankInput, validPayload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com apenas campos obrigatórios (bankId)", async () => {
      const { bankId } = validPayload;
      const errors = await validateInput(ListOperationBankInput, { bankId });
      expect(errors).toHaveLength(0);
    });
  });

  describe("limit (opcional)", () => {
    it("aceita 0", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        limit: 0,
      });
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        limit: 5,
      });
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        limit: 10.5 as unknown as number,
      });
      expect(constraintsFor(errors, "limit")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        limit: -1,
      });
      expect(constraintsFor(errors, "limit")).toContain("min");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        limit: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("offset (opcional)", () => {
    it("aceita 0", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        offset: 0,
      });
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("rejeita valor negativo", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        offset: -1,
      });
      expect(constraintsFor(errors, "offset")).toContain("min");
    });

    it("rejeita valor não inteiro", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        offset: 1.5 as unknown as number,
      });
      expect(constraintsFor(errors, "offset")).toContain("isInt");
    });
  });

  describe("bankId (obrigatório)", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const errors = await validateInput(ListOperationBankInput, {});
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: null,
      } as unknown as ListOperationBankInput);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });
  });

  describe("bankBoxId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        bankBoxId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "bankBoxId")).toHaveLength(0);
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        bankBoxId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "bankBoxId")).toContain("isUuid");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        bankBoxId: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("invoiceId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        invoiceId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "invoiceId")).toHaveLength(0);
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        invoiceId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "invoiceId")).toContain("isUuid");
    });
  });

  describe("tag (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        tag: "a".repeat(64),
      });
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        tag: "a".repeat(65),
      });
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });
  });

  describe("typeOperation (opcional)", () => {
    it("aceita valores válidos do enum", async () => {
      for (const value of Object.values(OperationEnum)) {
        const errors = await validateInput(ListOperationBankInput, {
          bankId: validPayload.bankId,
          typeOperation: value,
        });
        expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        typeOperation: "INVALIDO" as unknown as OperationEnum,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });
  });

  describe("local (opcional)", () => {
    it("aceita valores válidos do enum", async () => {
      for (const value of Object.values(LocalEnum)) {
        const errors = await validateInput(ListOperationBankInput, {
          bankId: validPayload.bankId,
          local: value,
        });
        expect(constraintsFor(errors, "local")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        local: "INVALIDO" as unknown as LocalEnum,
      });
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });
  });

  describe("startDate / endDate (opcionais)", () => {
    it.each(["2026-01-01", "2026-12-31"])(
      "aceita data válida em startDate: %s",
      async (value) => {
        const errors = await validateInput(ListOperationBankInput, {
          bankId: validPayload.bankId,
          startDate: value,
        });
        expect(constraintsFor(errors, "startDate")).toHaveLength(0);
      }
    );

    it("rejeita data inválida em startDate", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        startDate: "data-invalida",
      });
      expect(constraintsFor(errors, "startDate")).toContain("isDateString");
    });

    it("rejeita data inválida em endDate", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        endDate: "32/01/2026",
      });
      expect(constraintsFor(errors, "endDate")).toContain("isDateString");
    });
  });

  describe("minAmount / maxAmount (opcionais)", () => {
    it("aceita formato de moeda válido em minAmount", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        minAmount: "100.00",
      });
      expect(constraintsFor(errors, "minAmount")).toHaveLength(0);
    });

    it("rejeita formato de moeda inválido em minAmount", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        minAmount: "invalido",
      });
      expect(constraintsFor(errors, "minAmount")).toContain("isCurrency");
    });

    it("rejeita formato de moeda inválido em maxAmount", async () => {
      const errors = await validateInput(ListOperationBankInput, {
        bankId: validPayload.bankId,
        maxAmount: "invalido",
      });
      expect(constraintsFor(errors, "maxAmount")).toContain("isCurrency");
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        limit: -1,
        offset: -1,
        bankId: "uuid-invalido",
        tag: "a".repeat(65),
        typeOperation: "INVALIDO" as unknown as OperationEnum,
        local: "INVALIDO" as unknown as LocalEnum,
        startDate: "data-invalida",
        endDate: "data-invalida",
      };
      const errors = await validateInput(ListOperationBankInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        [
          "bankId",
          "endDate",
          "limit",
          "local",
          "offset",
          "startDate",
          "tag",
          "typeOperation",
        ].sort()
      );
    });
  });
});

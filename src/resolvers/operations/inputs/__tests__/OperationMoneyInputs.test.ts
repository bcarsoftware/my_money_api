import "reflect-metadata";

import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import {
  CreateOperationMoneyInput,
  ListOperationMoneyInput,
  UpdateOperationMoneyInput,
} from "@/resolvers/operations/inputs/OperationMoneyInputs";
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
// CreateOperationMoneyInput
// ============================================================
describe("CreateOperationMoneyInput", () => {
  const validPayload = {
    moneyId: "550e8400-e29b-41d4-a716-446655440000",
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
        CreateOperationMoneyInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com campos opcionais omitidos", async () => {
      const { description, discount, forfeit, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com campos opcionais definidos como null", async () => {
      const payload = {
        ...validPayload,
        description: null,
        discount: null,
        forfeit: null,
      };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("moneyId (obrigatório)", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        moneyId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "moneyId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const payload = {
        ...validPayload,
        moneyId: "550e8400-e29b-11d4-a716-446655440000",
      };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const payload = { ...validPayload, moneyId: "nao-e-uuid" };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { moneyId, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        moneyId: null,
      } as unknown as CreateOperationMoneyInput;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });
  });

  describe("tag (obrigatório)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const payload = { ...validPayload, tag: "a".repeat(64) };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const payload = { ...validPayload, tag: "a".repeat(65) };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("rejeita quando ausente", async () => {
      const { tag, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        tag: null,
      } as unknown as CreateOperationMoneyInput;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres", async () => {
      const payload = { ...validPayload, description: "a".repeat(256) };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const payload = { ...validPayload, description: "a".repeat(257) };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, description: null };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const { description, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
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
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "balance")).toHaveLength(0);
    });

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const payload = { ...validPayload, balance: value };
        const errors = await validateInput(CreateOperationMoneyInput, payload);
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente", async () => {
      const { balance, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        balance: null,
      } as unknown as CreateOperationMoneyInput;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("discount (opcional, permite negativos)", () => {
    it.each(["100.00", "0.00", "-50.00", "1,234.56"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const payload = { ...validPayload, discount: value };
        const errors = await validateInput(CreateOperationMoneyInput, payload);
        expect(constraintsFor(errors, "discount")).toHaveLength(0);
      }
    );

    it("rejeita formato inválido", async () => {
      const payload = { ...validPayload, discount: "não é moeda" };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "discount")).toContain("isCurrency");
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, discount: null };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "discount")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const { discount, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "discount")).toHaveLength(0);
    });
  });

  describe("forfeit (opcional, NÃO permite negativos)", () => {
    it.each(["100.00", "0.00", "50.00"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const payload = { ...validPayload, forfeit: value };
        const errors = await validateInput(CreateOperationMoneyInput, payload);
        expect(constraintsFor(errors, "forfeit")).toHaveLength(0);
      }
    );

    it("rejeita valor negativo (allow_negatives: false)", async () => {
      const payload = { ...validPayload, forfeit: "-50.00" };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "forfeit")).toContain("isCurrency");
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, forfeit: null };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "forfeit")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const { forfeit, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "forfeit")).toHaveLength(0);
    });
  });

  describe("typeOperation (obrigatório)", () => {
    it("aceita todos os valores do enum OperationEnum", async () => {
      for (const value of Object.values(OperationEnum)) {
        const payload = { ...validPayload, typeOperation: value };
        const errors = await validateInput(CreateOperationMoneyInput, payload);
        expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const payload = {
        ...validPayload,
        typeOperation: "INVALIDO" as unknown as OperationEnum,
      };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });

    it("rejeita quando ausente", async () => {
      const { typeOperation, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        typeOperation: null,
      } as unknown as CreateOperationMoneyInput;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });
  });

  describe("local (obrigatório)", () => {
    it("aceita todos os valores do enum LocalEnum", async () => {
      for (const value of Object.values(LocalEnum)) {
        const payload = { ...validPayload, local: value };
        const errors = await validateInput(CreateOperationMoneyInput, payload);
        expect(constraintsFor(errors, "local")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const payload = {
        ...validPayload,
        local: "INVALIDO" as unknown as LocalEnum,
      };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });

    it("rejeita quando ausente", async () => {
      const { local, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        local: null,
      } as unknown as CreateOperationMoneyInput;
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        moneyId: "uuid-invalido",
        tag: "a".repeat(65),
        balance: "não é moeda",
        typeOperation: "INVALIDO" as unknown as OperationEnum,
        local: "INVALIDO" as unknown as LocalEnum,
      };
      const errors = await validateInput(CreateOperationMoneyInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["balance", "local", "moneyId", "tag", "typeOperation"].sort()
      );
    });
  });
});

// ============================================================
// UpdateOperationMoneyInput
// ============================================================
describe("UpdateOperationMoneyInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos opcionais)", async () => {
      const errors = await validateInput(UpdateOperationMoneyInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        tag: "Compra",
        description: "Descrição atualizada",
      };
      const errors = await validateInput(UpdateOperationMoneyInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("tag (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const input = { tag: "a".repeat(64) };
      const errors = await validateInput(UpdateOperationMoneyInput, input);
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const input = { tag: "a".repeat(65) };
      const errors = await validateInput(UpdateOperationMoneyInput, input);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { tag: undefined };
      const errors = await validateInput(UpdateOperationMoneyInput, input);
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres", async () => {
      const input = { description: "a".repeat(256) };
      const errors = await validateInput(UpdateOperationMoneyInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const input = { description: "a".repeat(257) };
      const errors = await validateInput(UpdateOperationMoneyInput, input);
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null", async () => {
      const input = {
        description: null,
      } as unknown as UpdateOperationMoneyInput;
      const errors = await validateInput(UpdateOperationMoneyInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const input = { description: undefined };
      const errors = await validateInput(UpdateOperationMoneyInput, input);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const input = {
        tag: "a".repeat(65),
        description: "a".repeat(257),
      };
      const errors = await validateInput(UpdateOperationMoneyInput, input);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(["description", "tag"].sort());
    });
  });
});

// ============================================================
// ListOperationMoneyInput
// ============================================================
describe("ListOperationMoneyInput", () => {
  const validPayload = {
    limit: 10,
    offset: 0,
    moneyId: "550e8400-e29b-41d4-a716-446655440000",
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
      const errors = await validateInput(ListOperationMoneyInput, validPayload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com apenas campos obrigatórios (moneyId)", async () => {
      const { moneyId } = validPayload;
      const errors = await validateInput(ListOperationMoneyInput, { moneyId });
      expect(errors).toHaveLength(0);
    });
  });

  describe("limit (opcional)", () => {
    it("aceita 0", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        limit: 0,
      });
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        limit: 5,
      });
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        limit: 10.5 as unknown as number,
      });
      expect(constraintsFor(errors, "limit")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        limit: -1,
      });
      expect(constraintsFor(errors, "limit")).toContain("min");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        limit: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("offset (opcional)", () => {
    it("aceita 0", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        offset: 0,
      });
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("rejeita valor negativo", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        offset: -1,
      });
      expect(constraintsFor(errors, "offset")).toContain("min");
    });

    it("rejeita valor não inteiro", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        offset: 1.5 as unknown as number,
      });
      expect(constraintsFor(errors, "offset")).toContain("isInt");
    });
  });

  describe("moneyId (obrigatório)", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "moneyId")).toHaveLength(0);
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {});
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: null,
      } as unknown as ListOperationMoneyInput);
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });
  });

  describe("tag (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        tag: "a".repeat(64),
      });
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        tag: "a".repeat(65),
      });
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        tag: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("typeOperation (opcional)", () => {
    it("aceita valores válidos do enum", async () => {
      for (const value of Object.values(OperationEnum)) {
        const errors = await validateInput(ListOperationMoneyInput, {
          moneyId: validPayload.moneyId,
          typeOperation: value,
        });
        expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        typeOperation: "INVALIDO" as unknown as OperationEnum,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        typeOperation: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("local (opcional)", () => {
    it("aceita valores válidos do enum", async () => {
      for (const value of Object.values(LocalEnum)) {
        const errors = await validateInput(ListOperationMoneyInput, {
          moneyId: validPayload.moneyId,
          local: value,
        });
        expect(constraintsFor(errors, "local")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        local: "INVALIDO" as unknown as LocalEnum,
      });
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        local: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("startDate / endDate (opcionais)", () => {
    it.each(["2026-01-01", "2026-12-31"])(
      "aceita data válida em startDate: %s",
      async (value) => {
        const errors = await validateInput(ListOperationMoneyInput, {
          moneyId: validPayload.moneyId,
          startDate: value,
        });
        expect(constraintsFor(errors, "startDate")).toHaveLength(0);
      }
    );

    it("rejeita data inválida em startDate", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        startDate: "data-invalida",
      });
      expect(constraintsFor(errors, "startDate")).toContain("isDateString");
    });

    it("rejeita data inválida em endDate", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        endDate: "32/01/2026",
      });
      expect(constraintsFor(errors, "endDate")).toContain("isDateString");
    });
  });

  describe("minAmount / maxAmount (opcionais)", () => {
    it("aceita formato de moeda válido em minAmount", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        minAmount: "100.00",
      });
      expect(constraintsFor(errors, "minAmount")).toHaveLength(0);
    });

    it("rejeita formato de moeda inválido em minAmount", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
        minAmount: "invalido",
      });
      expect(constraintsFor(errors, "minAmount")).toContain("isCurrency");
    });

    it("rejeita formato de moeda inválido em maxAmount", async () => {
      const errors = await validateInput(ListOperationMoneyInput, {
        moneyId: validPayload.moneyId,
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
        moneyId: "uuid-invalido",
        tag: "a".repeat(65),
        typeOperation: "INVALIDO" as unknown as OperationEnum,
        local: "INVALIDO" as unknown as LocalEnum,
        startDate: "data-invalida",
        endDate: "data-invalida",
      };
      const errors = await validateInput(ListOperationMoneyInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        [
          "endDate",
          "limit",
          "local",
          "moneyId",
          "offset",
          "startDate",
          "tag",
          "typeOperation",
        ].sort()
      );
    });
  });
});

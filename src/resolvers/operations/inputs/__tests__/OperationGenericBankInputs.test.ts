import "reflect-metadata";

import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import {
  CreateOperationGenericBankInput,
  ListOperationGenericBankInput,
  UpdateOperationGenericBankInput,
} from "@/resolvers/operations/inputs/OperationGenericBankInputs";
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
// CreateOperationGenericBankInput
// ============================================================
describe("CreateOperationGenericBankInput", () => {
  const validPayload = {
    genericBankId: "550e8400-e29b-41d4-a716-446655440000",
    genericBankBoxId: "550e8400-e29b-41d4-a716-446655440001",
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
        CreateOperationGenericBankInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com campos opcionais omitidos", async () => {
      const { genericBankBoxId, description, discount, forfeit, ...payload } =
        validPayload;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com campos opcionais definidos como null", async () => {
      const payload = {
        ...validPayload,
        genericBankBoxId: null,
        description: null,
        discount: null,
        forfeit: null,
      };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("genericBankId (obrigatório)", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        genericBankId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "genericBankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const payload = {
        ...validPayload,
        genericBankId: "550e8400-e29b-11d4-a716-446655440000",
      };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const payload = { ...validPayload, genericBankId: "nao-e-uuid" };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { genericBankId, ...payload } = validPayload;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        genericBankId: null,
      } as unknown as CreateOperationGenericBankInput;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });
  });

  describe("genericBankBoxId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const payload = {
        ...validPayload,
        genericBankBoxId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "genericBankBoxId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const payload = {
        ...validPayload,
        genericBankBoxId: "550e8400-e29b-11d4-a716-446655440000",
      };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "genericBankBoxId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const payload = { ...validPayload, genericBankBoxId: "nao-e-uuid" };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "genericBankBoxId")).toContain("isUuid");
    });

    it("aceita undefined (omitido)", async () => {
      const { genericBankBoxId, ...payload } = validPayload;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "genericBankBoxId")).toHaveLength(0);
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, genericBankBoxId: null };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "genericBankBoxId")).toHaveLength(0);
    });
  });

  describe("tag (obrigatório)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const payload = { ...validPayload, tag: "a".repeat(64) };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const payload = { ...validPayload, tag: "a".repeat(65) };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("rejeita quando ausente", async () => {
      const { tag, ...payload } = validPayload;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        tag: null,
      } as unknown as CreateOperationGenericBankInput;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres", async () => {
      const payload = { ...validPayload, description: "a".repeat(256) };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const payload = { ...validPayload, description: "a".repeat(257) };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, description: null };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const { description, ...payload } = validPayload;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
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
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "balance")).toHaveLength(0);
    });

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const payload = { ...validPayload, balance: value };
        const errors = await validateInput(
          CreateOperationGenericBankInput,
          payload
        );
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente", async () => {
      const { balance, ...payload } = validPayload;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        balance: null,
      } as unknown as CreateOperationGenericBankInput;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("discount (opcional, permite negativos)", () => {
    it.each(["100.00", "0.00", "-50.00", "1,234.56"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const payload = { ...validPayload, discount: value };
        const errors = await validateInput(
          CreateOperationGenericBankInput,
          payload
        );
        expect(constraintsFor(errors, "discount")).toHaveLength(0);
      }
    );

    it("rejeita formato inválido", async () => {
      const payload = { ...validPayload, discount: "não é moeda" };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "discount")).toContain("isCurrency");
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, discount: null };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "discount")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const { discount, ...payload } = validPayload;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "discount")).toHaveLength(0);
    });
  });

  describe("forfeit (opcional, NÃO permite negativos)", () => {
    it.each(["100.00", "0.00", "50.00"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const payload = { ...validPayload, forfeit: value };
        const errors = await validateInput(
          CreateOperationGenericBankInput,
          payload
        );
        expect(constraintsFor(errors, "forfeit")).toHaveLength(0);
      }
    );

    it("rejeita valor negativo (allow_negatives: false)", async () => {
      const payload = { ...validPayload, forfeit: "-50.00" };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "forfeit")).toContain("isCurrency");
    });

    it("aceita null", async () => {
      const payload = { ...validPayload, forfeit: null };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "forfeit")).toHaveLength(0);
    });
  });

  describe("typeOperation (obrigatório)", () => {
    it("aceita todos os valores do enum OperationEnum", async () => {
      for (const value of Object.values(OperationEnum)) {
        const payload = { ...validPayload, typeOperation: value };
        const errors = await validateInput(
          CreateOperationGenericBankInput,
          payload
        );
        expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const payload = {
        ...validPayload,
        typeOperation: "INVALIDO" as unknown as OperationEnum,
      };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });

    it("rejeita quando ausente", async () => {
      const { typeOperation, ...payload } = validPayload;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        typeOperation: null,
      } as unknown as CreateOperationGenericBankInput;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });
  });

  describe("local (obrigatório)", () => {
    it("aceita todos os valores do enum LocalEnum", async () => {
      for (const value of Object.values(LocalEnum)) {
        const payload = { ...validPayload, local: value };
        const errors = await validateInput(
          CreateOperationGenericBankInput,
          payload
        );
        expect(constraintsFor(errors, "local")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const payload = {
        ...validPayload,
        local: "INVALIDO" as unknown as LocalEnum,
      };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });

    it("rejeita quando ausente", async () => {
      const { local, ...payload } = validPayload;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });

    it("rejeita null", async () => {
      const payload = {
        ...validPayload,
        local: null,
      } as unknown as CreateOperationGenericBankInput;
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        genericBankId: "uuid-invalido",
        tag: "a".repeat(65),
        balance: "não é moeda",
        typeOperation: "INVALIDO" as unknown as OperationEnum,
        local: "INVALIDO" as unknown as LocalEnum,
      };
      const errors = await validateInput(
        CreateOperationGenericBankInput,
        payload
      );
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["balance", "genericBankId", "local", "tag", "typeOperation"].sort()
      );
    });
  });
});

// ============================================================
// UpdateOperationGenericBankInput
// ============================================================
describe("UpdateOperationGenericBankInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos opcionais)", async () => {
      const errors = await validateInput(UpdateOperationGenericBankInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        tag: "Compra",
        description: "Descrição atualizada",
      };
      const errors = await validateInput(
        UpdateOperationGenericBankInput,
        input
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("tag (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const input = { tag: "a".repeat(64) };
      const errors = await validateInput(
        UpdateOperationGenericBankInput,
        input
      );
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const input = { tag: "a".repeat(65) };
      const errors = await validateInput(
        UpdateOperationGenericBankInput,
        input
      );
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const input = { tag: undefined };
      const errors = await validateInput(
        UpdateOperationGenericBankInput,
        input
      );
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres", async () => {
      const input = { description: "a".repeat(256) };
      const errors = await validateInput(
        UpdateOperationGenericBankInput,
        input
      );
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const input = { description: "a".repeat(257) };
      const errors = await validateInput(
        UpdateOperationGenericBankInput,
        input
      );
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null", async () => {
      const input = {
        description: null,
      } as unknown as UpdateOperationGenericBankInput;
      const errors = await validateInput(
        UpdateOperationGenericBankInput,
        input
      );
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const input = { description: undefined };
      const errors = await validateInput(
        UpdateOperationGenericBankInput,
        input
      );
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const input = {
        tag: "a".repeat(65),
        description: "a".repeat(257),
      };
      const errors = await validateInput(
        UpdateOperationGenericBankInput,
        input
      );
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(["description", "tag"].sort());
    });
  });
});

// ============================================================
// ListOperationGenericBankInput
// ============================================================
describe("ListOperationGenericBankInput", () => {
  const validPayload = {
    limit: 10,
    offset: 0,
    genericBankId: "550e8400-e29b-41d4-a716-446655440000",
    genericBankBoxId: "550e8400-e29b-41d4-a716-446655440001",
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
      const errors = await validateInput(
        ListOperationGenericBankInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com apenas campos obrigatórios (genericBankId)", async () => {
      const { genericBankId } = validPayload;
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("limit (opcional)", () => {
    it("aceita 0", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        limit: 0,
      });
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        limit: 5,
      });
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        limit: 10.5 as unknown as number,
      });
      expect(constraintsFor(errors, "limit")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        limit: -1,
      });
      expect(constraintsFor(errors, "limit")).toContain("min");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        limit: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("offset (opcional)", () => {
    it("aceita 0", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        offset: 0,
      });
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("rejeita valor negativo", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        offset: -1,
      });
      expect(constraintsFor(errors, "offset")).toContain("min");
    });

    it("rejeita valor não inteiro", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        offset: 1.5 as unknown as number,
      });
      expect(constraintsFor(errors, "offset")).toContain("isInt");
    });
  });

  describe("genericBankId (obrigatório)", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "genericBankId")).toHaveLength(0);
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {});
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: null,
      } as unknown as ListOperationGenericBankInput);
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });
  });

  describe("genericBankBoxId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        genericBankBoxId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "genericBankBoxId")).toHaveLength(0);
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        genericBankBoxId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "genericBankBoxId")).toContain("isUuid");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        genericBankBoxId: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("tag (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        tag: "a".repeat(64),
      });
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        tag: "a".repeat(65),
      });
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });
  });

  describe("typeOperation (opcional)", () => {
    it("aceita valores válidos do enum", async () => {
      for (const value of Object.values(OperationEnum)) {
        const errors = await validateInput(ListOperationGenericBankInput, {
          genericBankId: validPayload.genericBankId,
          typeOperation: value,
        });
        expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        typeOperation: "INVALIDO" as unknown as OperationEnum,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });
  });

  describe("local (opcional)", () => {
    it("aceita valores válidos do enum", async () => {
      for (const value of Object.values(LocalEnum)) {
        const errors = await validateInput(ListOperationGenericBankInput, {
          genericBankId: validPayload.genericBankId,
          local: value,
        });
        expect(constraintsFor(errors, "local")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        local: "INVALIDO" as unknown as LocalEnum,
      });
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });
  });

  describe("startDate / endDate (opcionais)", () => {
    it.each(["2026-01-01", "2026-12-31"])(
      "aceita data válida em startDate: %s",
      async (value) => {
        const errors = await validateInput(ListOperationGenericBankInput, {
          genericBankId: validPayload.genericBankId,
          startDate: value,
        });
        expect(constraintsFor(errors, "startDate")).toHaveLength(0);
      }
    );

    it("rejeita data inválida em startDate", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        startDate: "data-invalida",
      });
      expect(constraintsFor(errors, "startDate")).toContain("isDateString");
    });

    it("rejeita data inválida em endDate", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        endDate: "32/01/2026",
      });
      expect(constraintsFor(errors, "endDate")).toContain("isDateString");
    });
  });

  describe("minAmount / maxAmount (opcionais)", () => {
    it("aceita formato de moeda válido em minAmount", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        minAmount: "100.00",
      });
      expect(constraintsFor(errors, "minAmount")).toHaveLength(0);
    });

    it("rejeita formato de moeda inválido em minAmount", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
        minAmount: "invalido",
      });
      expect(constraintsFor(errors, "minAmount")).toContain("isCurrency");
    });

    it("rejeita formato de moeda inválido em maxAmount", async () => {
      const errors = await validateInput(ListOperationGenericBankInput, {
        genericBankId: validPayload.genericBankId,
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
        genericBankId: "uuid-invalido",
        tag: "a".repeat(65),
        typeOperation: "INVALIDO" as unknown as OperationEnum,
        local: "INVALIDO" as unknown as LocalEnum,
        startDate: "data-invalida",
        endDate: "data-invalida",
      };
      const errors = await validateInput(
        ListOperationGenericBankInput,
        payload
      );
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        [
          "endDate",
          "genericBankId",
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

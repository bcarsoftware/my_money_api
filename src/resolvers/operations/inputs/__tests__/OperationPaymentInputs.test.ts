import "reflect-metadata";

import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import {
  CreateOperationPaymentInput,
  ListOperationPaymentInput,
  UpdateOperationPaymentInput,
} from "@/resolvers/operations/inputs/OperationPaymentInputs";
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

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID_2 = "550e8400-e29b-41d4-a716-446655440001";
const UUID_3 = "550e8400-e29b-41d4-a716-446655440002";

// ============================================================
// CreateOperationPaymentInput
// ============================================================
describe("CreateOperationPaymentInput", () => {
  const validPayload = {
    paymentId: UUID,
    tag: "Pagamento",
    description: "Descrição qualquer",
    balance: "100.00",
    discount: "10.00",
    forfeit: "5.00",
    typeOperation: OperationEnum.PAYMENT,
    local: LocalEnum.INTERNAL,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(
        CreateOperationPaymentInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com campos opcionais omitidos", async () => {
      const { description, discount, forfeit, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationPaymentInput, payload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com campos opcionais definidos como null", async () => {
      const payload = {
        ...validPayload,
        description: null,
        discount: null,
        forfeit: null,
      };
      const errors = await validateInput(CreateOperationPaymentInput, payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("paymentId (obrigatório)", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        paymentId: UUID,
      });
      expect(constraintsFor(errors, "paymentId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        paymentId: "550e8400-e29b-11d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "paymentId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        paymentId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "paymentId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { paymentId, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationPaymentInput, payload);
      expect(constraintsFor(errors, "paymentId")).toContain("isUuid");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        paymentId: null,
      } as unknown as CreateOperationPaymentInput);
      expect(constraintsFor(errors, "paymentId")).toContain("isUuid");
    });
  });

  describe("bankId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        bankId: UUID_2,
      });
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        bankId: "550e8400-e29b-11d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        bankId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("aceita null", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        bankId: null,
      });
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        bankId: undefined,
      });
      expect(constraintsFor(errors, "bankId")).toHaveLength(0);
    });
  });

  describe("genericBankId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        genericBankId: UUID_2,
      });
      expect(constraintsFor(errors, "genericBankId")).toHaveLength(0);
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        genericBankId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("aceita null", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        genericBankId: null,
      });
      expect(constraintsFor(errors, "genericBankId")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        genericBankId: undefined,
      });
      expect(constraintsFor(errors, "genericBankId")).toHaveLength(0);
    });
  });

  describe("moneyId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        moneyId: UUID_3,
      });
      expect(constraintsFor(errors, "moneyId")).toHaveLength(0);
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        moneyId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });

    it("aceita null", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        moneyId: null,
      });
      expect(constraintsFor(errors, "moneyId")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        moneyId: undefined,
      });
      expect(constraintsFor(errors, "moneyId")).toHaveLength(0);
    });
  });

  describe("tag (obrigatório)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        tag: "a".repeat(64),
      });
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        tag: "a".repeat(65),
      });
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("rejeita quando ausente", async () => {
      const { tag, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationPaymentInput, payload);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        tag: null,
      } as unknown as CreateOperationPaymentInput);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        description: "a".repeat(256),
      });
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        description: "a".repeat(257),
      });
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        description: null,
      });
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        description: undefined,
      });
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
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        balance: value,
      });
      expect(constraintsFor(errors, "balance")).toHaveLength(0);
    });

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const errors = await validateInput(CreateOperationPaymentInput, {
          ...validPayload,
          balance: value,
        });
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente", async () => {
      const { balance, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationPaymentInput, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        balance: null,
      } as unknown as CreateOperationPaymentInput);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("discount (opcional, permite negativos)", () => {
    it.each(["100.00", "0.00", "-50.00", "1,234.56", "100"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const errors = await validateInput(CreateOperationPaymentInput, {
          ...validPayload,
          discount: value,
        });
        expect(constraintsFor(errors, "discount")).toHaveLength(0);
      }
    );

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const errors = await validateInput(CreateOperationPaymentInput, {
          ...validPayload,
          discount: value,
        });
        expect(constraintsFor(errors, "discount")).toContain("isCurrency");
      }
    );

    it("aceita null", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        discount: null,
      });
      expect(constraintsFor(errors, "discount")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        discount: undefined,
      });
      expect(constraintsFor(errors, "discount")).toHaveLength(0);
    });
  });

  describe("forfeit (opcional, NÃO permite negativos)", () => {
    it.each(["100.00", "0.00", "50.00", "1,234.56", "100"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const errors = await validateInput(CreateOperationPaymentInput, {
          ...validPayload,
          forfeit: value,
        });
        expect(constraintsFor(errors, "forfeit")).toHaveLength(0);
      }
    );

    it("rejeita valor negativo (allow_negatives: false)", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        forfeit: "-50.00",
      });
      expect(constraintsFor(errors, "forfeit")).toContain("isCurrency");
    });

    it.each(["não é moeda", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const errors = await validateInput(CreateOperationPaymentInput, {
          ...validPayload,
          forfeit: value,
        });
        expect(constraintsFor(errors, "forfeit")).toContain("isCurrency");
      }
    );

    it("aceita null", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        forfeit: null,
      });
      expect(constraintsFor(errors, "forfeit")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        forfeit: undefined,
      });
      expect(constraintsFor(errors, "forfeit")).toHaveLength(0);
    });
  });

  describe("typeOperation (obrigatório)", () => {
    it("aceita todos os valores do enum OperationEnum", async () => {
      for (const value of Object.values(OperationEnum)) {
        const errors = await validateInput(CreateOperationPaymentInput, {
          ...validPayload,
          typeOperation: value,
        });
        expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        typeOperation: "INVALIDO" as unknown as OperationEnum,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });

    it("rejeita quando ausente", async () => {
      const { typeOperation, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationPaymentInput, payload);
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        typeOperation: null,
      } as unknown as CreateOperationPaymentInput);
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });
  });

  describe("local (obrigatório)", () => {
    it("aceita todos os valores do enum LocalEnum", async () => {
      for (const value of Object.values(LocalEnum)) {
        const errors = await validateInput(CreateOperationPaymentInput, {
          ...validPayload,
          local: value,
        });
        expect(constraintsFor(errors, "local")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        local: "INVALIDO" as unknown as LocalEnum,
      });
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });

    it("rejeita quando ausente", async () => {
      const { local, ...payload } = validPayload;
      const errors = await validateInput(CreateOperationPaymentInput, payload);
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(CreateOperationPaymentInput, {
        ...validPayload,
        local: null,
      } as unknown as CreateOperationPaymentInput);
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        paymentId: "uuid-invalido",
        tag: "a".repeat(65),
        balance: "não é moeda",
        typeOperation: "INVALIDO" as unknown as OperationEnum,
        local: "INVALIDO" as unknown as LocalEnum,
      };
      const errors = await validateInput(CreateOperationPaymentInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["balance", "local", "paymentId", "tag", "typeOperation"].sort()
      );
    });
  });
});

// ============================================================
// UpdateOperationPaymentInput
// ============================================================
describe("UpdateOperationPaymentInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos opcionais)", async () => {
      const errors = await validateInput(UpdateOperationPaymentInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const input = {
        tag: "Pagamento",
        description: "Descrição atualizada",
      };
      const errors = await validateInput(UpdateOperationPaymentInput, input);
      expect(errors).toHaveLength(0);
    });
  });

  describe("tag (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const errors = await validateInput(UpdateOperationPaymentInput, {
        tag: "a".repeat(64),
      });
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const errors = await validateInput(UpdateOperationPaymentInput, {
        tag: "a".repeat(65),
      });
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(UpdateOperationPaymentInput, {
        tag: undefined,
      });
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres", async () => {
      const errors = await validateInput(UpdateOperationPaymentInput, {
        description: "a".repeat(256),
      });
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres", async () => {
      const errors = await validateInput(UpdateOperationPaymentInput, {
        description: "a".repeat(257),
      });
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null", async () => {
      const errors = await validateInput(UpdateOperationPaymentInput, {
        description: null,
      } as unknown as UpdateOperationPaymentInput);
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(UpdateOperationPaymentInput, {
        description: undefined,
      });
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const errors = await validateInput(UpdateOperationPaymentInput, {
        tag: "a".repeat(65),
        description: "a".repeat(257),
      });
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(["description", "tag"].sort());
    });
  });
});

// ============================================================
// ListOperationPaymentInput
// ============================================================
describe("ListOperationPaymentInput", () => {
  const validPayload = {
    limit: 10,
    offset: 0,
    paymentId: UUID,
    tag: "Pagamento",
    typeOperation: OperationEnum.PAYMENT,
    local: LocalEnum.INTERNAL,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    minAmount: "100.00",
    maxAmount: "1000.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(
        ListOperationPaymentInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com apenas campos obrigatórios (paymentId)", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("limit (opcional)", () => {
    it("aceita 0", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        limit: 0,
      });
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        limit: 5,
      });
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        limit: 10.5 as unknown as number,
      });
      expect(constraintsFor(errors, "limit")).toContain("isInt");
    });

    it("rejeita valor negativo", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        limit: -1,
      });
      expect(constraintsFor(errors, "limit")).toContain("min");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        limit: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("offset (opcional)", () => {
    it("aceita 0", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        offset: 0,
      });
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("rejeita valor negativo", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        offset: -1,
      });
      expect(constraintsFor(errors, "offset")).toContain("min");
    });

    it("rejeita valor não inteiro", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        offset: 1.5 as unknown as number,
      });
      expect(constraintsFor(errors, "offset")).toContain("isInt");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        offset: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("paymentId (obrigatório)", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: UUID,
      });
      expect(constraintsFor(errors, "paymentId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: "550e8400-e29b-11d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "paymentId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "paymentId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {});
      expect(constraintsFor(errors, "paymentId")).toContain("isUuid");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: null,
      } as unknown as ListOperationPaymentInput);
      expect(constraintsFor(errors, "paymentId")).toContain("isUuid");
    });
  });

  describe("tag (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        tag: "a".repeat(64),
      });
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        tag: "a".repeat(65),
      });
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        tag: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("typeOperation (opcional)", () => {
    it("aceita valores válidos do enum", async () => {
      for (const value of Object.values(OperationEnum)) {
        const errors = await validateInput(ListOperationPaymentInput, {
          paymentId: validPayload.paymentId,
          typeOperation: value,
        });
        expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        typeOperation: "INVALIDO" as unknown as OperationEnum,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        typeOperation: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("local (opcional)", () => {
    it("aceita valores válidos do enum", async () => {
      for (const value of Object.values(LocalEnum)) {
        const errors = await validateInput(ListOperationPaymentInput, {
          paymentId: validPayload.paymentId,
          local: value,
        });
        expect(constraintsFor(errors, "local")).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        local: "INVALIDO" as unknown as LocalEnum,
      });
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        local: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("startDate / endDate (opcionais)", () => {
    it.each(["2026-01-01", "2026-12-31"])(
      "aceita data válida em startDate: %s",
      async (value) => {
        const errors = await validateInput(ListOperationPaymentInput, {
          paymentId: validPayload.paymentId,
          startDate: value,
        });
        expect(constraintsFor(errors, "startDate")).toHaveLength(0);
      }
    );

    it("aceita data válida em endDate", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        endDate: "2026-12-31",
      });
      expect(constraintsFor(errors, "endDate")).toHaveLength(0);
    });

    it("rejeita data inválida em startDate", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        startDate: "data-invalida",
      });
      expect(constraintsFor(errors, "startDate")).toContain("isDateString");
    });

    it("rejeita data inválida em endDate", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        endDate: "32/01/2026",
      });
      expect(constraintsFor(errors, "endDate")).toContain("isDateString");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        startDate: undefined,
        endDate: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("minAmount / maxAmount (opcionais)", () => {
    it("aceita formato de moeda válido em minAmount", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        minAmount: "100.00",
      });
      expect(constraintsFor(errors, "minAmount")).toHaveLength(0);
    });

    it("aceita formato de moeda válido em maxAmount", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        maxAmount: "1000.00",
      });
      expect(constraintsFor(errors, "maxAmount")).toHaveLength(0);
    });

    it("rejeita formato de moeda inválido em minAmount", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        minAmount: "invalido",
      });
      expect(constraintsFor(errors, "minAmount")).toContain("isCurrency");
    });

    it("rejeita formato de moeda inválido em maxAmount", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        maxAmount: "invalido",
      });
      expect(constraintsFor(errors, "maxAmount")).toContain("isCurrency");
    });

    it("aceita undefined (omitido)", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        paymentId: validPayload.paymentId,
        minAmount: undefined,
        maxAmount: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de diferentes campos", async () => {
      const errors = await validateInput(ListOperationPaymentInput, {
        limit: -1,
        offset: -1,
        paymentId: "uuid-invalido",
        tag: "a".repeat(65),
        typeOperation: "INVALIDO" as unknown as OperationEnum,
        local: "INVALIDO" as unknown as LocalEnum,
        startDate: "data-invalida",
        endDate: "data-invalida",
        minAmount: "invalido",
        maxAmount: "invalido",
      });
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        [
          "endDate",
          "limit",
          "local",
          "maxAmount",
          "minAmount",
          "offset",
          "paymentId",
          "startDate",
          "tag",
          "typeOperation",
        ].sort()
      );
    });
  });
});

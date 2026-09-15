import "reflect-metadata";

import { validate, ValidationError } from "class-validator";

import { BankTransferEnum } from "@/enums/BankTrasnferEnum";
import { GenericBankTransferEnum } from "@/enums/GenericTransferEnum";
import { LocalEnum } from "@/enums/LocalEnum";
import {
  OperationBankDepositInput,
  OperationBankTransferInput,
  OperationBankWithdrawInput,
  OperationGenericBankDepositInput,
  OperationGenericBankTransferInput,
  OperationGenericBankWithdrawInput,
  OperationMoneyDepositInput,
  OperationMoneyWithdrawInput,
} from "@/resolvers/operations/inputs/OperationsInputs";

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

// ============================================================
// OperationBankTransferInput
// ============================================================
describe("OperationBankTransferInput", () => {
  const validPayload = {
    fromBankId: UUID,
    toBankId: UUID_2,
    amount: "100.00",
    typeOperation: BankTransferEnum.TRANSFER,
    local: LocalEnum.INTERNAL,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(
        OperationBankTransferInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("aceita toBankId omitido (opcional)", async () => {
      const { toBankId, ...payload } = validPayload;
      const errors = await validateInput(OperationBankTransferInput, payload);
      expect(errors).toHaveLength(0);
    });

    it("aceita todos os valores do enum BankTransferEnum", async () => {
      for (const typeOperation of Object.values(BankTransferEnum)) {
        const errors = await validateInput(OperationBankTransferInput, {
          ...validPayload,
          typeOperation,
        });
        expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
      }
    });

    it("aceita todos os valores do enum LocalEnum", async () => {
      for (const local of Object.values(LocalEnum)) {
        const errors = await validateInput(OperationBankTransferInput, {
          ...validPayload,
          local,
        });
        expect(constraintsFor(errors, "local")).toHaveLength(0);
      }
    });

    it("aceita amount negativo (allow_negatives: true)", async () => {
      const errors = await validateInput(OperationBankTransferInput, {
        ...validPayload,
        amount: "-100.00",
      });
      expect(constraintsFor(errors, "amount")).toHaveLength(0);
    });
  });

  describe("fromBankId", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(OperationBankTransferInput, {
        ...validPayload,
        fromBankId: UUID,
      });
      expect(constraintsFor(errors, "fromBankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const errors = await validateInput(OperationBankTransferInput, {
        ...validPayload,
        fromBankId: "550e8400-e29b-11d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "fromBankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(OperationBankTransferInput, {
        ...validPayload,
        fromBankId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "fromBankId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { fromBankId, ...payload } = validPayload;
      const errors = await validateInput(OperationBankTransferInput, payload);
      expect(constraintsFor(errors, "fromBankId")).toContain("isUuid");
    });
  });

  describe("toBankId (opcional)", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(OperationBankTransferInput, {
        ...validPayload,
        toBankId: UUID_2,
      });
      expect(constraintsFor(errors, "toBankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const errors = await validateInput(OperationBankTransferInput, {
        ...validPayload,
        toBankId: "550e8400-e29b-11d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "toBankId")).toContain("isUuid");
    });

    it("aceita undefined (omitido)", async () => {
      const { toBankId, ...payload } = validPayload;
      const errors = await validateInput(OperationBankTransferInput, payload);
      expect(constraintsFor(errors, "toBankId")).toHaveLength(0);
    });
  });

  describe("amount", () => {
    it.each(["100.00", "0.01", "-100.00", "1,234.56"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const errors = await validateInput(OperationBankTransferInput, {
          ...validPayload,
          amount: value,
        });
        expect(constraintsFor(errors, "amount")).not.toContain("isCurrency");
        expect(constraintsFor(errors, "amount")).not.toContain("isNotZero");
      }
    );

    it("rejeita zero (isNotZero)", async () => {
      const errors = await validateInput(OperationBankTransferInput, {
        ...validPayload,
        amount: "0.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("isNotZero");
    });

    it.each(["não é moeda", "", "100", "100.5"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const errors = await validateInput(OperationBankTransferInput, {
          ...validPayload,
          amount: value,
        });
        expect(constraintsFor(errors, "amount")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente", async () => {
      const { amount, ...payload } = validPayload;
      const errors = await validateInput(OperationBankTransferInput, payload);
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });
  });

  describe("typeOperation", () => {
    it("rejeita valor fora do enum", async () => {
      const errors = await validateInput(OperationBankTransferInput, {
        ...validPayload,
        typeOperation: "INVALIDO" as unknown as BankTransferEnum,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });

    it("rejeita quando ausente", async () => {
      const { typeOperation, ...payload } = validPayload;
      const errors = await validateInput(OperationBankTransferInput, payload);
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });
  });

  describe("local", () => {
    it("rejeita valor fora do enum", async () => {
      const errors = await validateInput(OperationBankTransferInput, {
        ...validPayload,
        local: "INVALIDO" as unknown as LocalEnum,
      });
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });

    it("rejeita quando ausente", async () => {
      const { local, ...payload } = validPayload;
      const errors = await validateInput(OperationBankTransferInput, payload);
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        fromBankId: "nao-e-uuid",
        toBankId: "nao-e-uuid",
        amount: "0.00",
        typeOperation: "INVALIDO" as unknown as BankTransferEnum,
        local: "INVALIDO" as unknown as LocalEnum,
      };
      const errors = await validateInput(OperationBankTransferInput, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["amount", "fromBankId", "local", "toBankId", "typeOperation"].sort()
      );
    });
  });
});

// ============================================================
// OperationBankDepositInput
// ============================================================
describe("OperationBankDepositInput", () => {
  const validPayload = {
    bankId: UUID,
    amount: "100.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(
        OperationBankDepositInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("aceita valores positivos grandes", async () => {
      const errors = await validateInput(OperationBankDepositInput, {
        ...validPayload,
        amount: "1,234,567.89",
      });
      expect(constraintsFor(errors, "amount")).toHaveLength(0);
    });
  });

  describe("bankId", () => {
    it("rejeita UUID com versão diferente de 4", async () => {
      const errors = await validateInput(OperationBankDepositInput, {
        ...validPayload,
        bankId: "550e8400-e29b-11d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { bankId, ...payload } = validPayload;
      const errors = await validateInput(OperationBankDepositInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });
  });

  describe("amount", () => {
    it("rejeita valor negativo (allow_negatives: false)", async () => {
      const errors = await validateInput(OperationBankDepositInput, {
        ...validPayload,
        amount: "-100.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });

    it("rejeita zero (isNotZero)", async () => {
      const errors = await validateInput(OperationBankDepositInput, {
        ...validPayload,
        amount: "0.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("isNotZero");
    });

    it.each(["100", "abc", "100.5"])(
      "rejeita formato sem decimais/ inválido: %s",
      async (value) => {
        const errors = await validateInput(OperationBankDepositInput, {
          ...validPayload,
          amount: value,
        });
        expect(constraintsFor(errors, "amount")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente", async () => {
      const { amount, ...payload } = validPayload;
      const errors = await validateInput(OperationBankDepositInput, payload);
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });
  });
});

// ============================================================
// OperationBankWithdrawInput
// ============================================================
describe("OperationBankWithdrawInput", () => {
  const validPayload = {
    bankId: UUID,
    amount: "-100.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(
        OperationBankWithdrawInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("aceita valores negativos grandes", async () => {
      const errors = await validateInput(OperationBankWithdrawInput, {
        ...validPayload,
        amount: "-1,234,567.89",
      });
      expect(constraintsFor(errors, "amount")).toHaveLength(0);
    });
  });

  describe("bankId", () => {
    it("rejeita UUID com versão diferente de 4", async () => {
      const errors = await validateInput(OperationBankWithdrawInput, {
        ...validPayload,
        bankId: "550e8400-e29b-11d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { bankId, ...payload } = validPayload;
      const errors = await validateInput(OperationBankWithdrawInput, payload);
      expect(constraintsFor(errors, "bankId")).toContain("isUuid");
    });
  });

  describe("amount (deve ser negativo)", () => {
    it("rejeita valor positivo (matches exige hífen)", async () => {
      const errors = await validateInput(OperationBankWithdrawInput, {
        ...validPayload,
        amount: "100.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("matches");
    });

    it("rejeita zero (matches + isNotZero)", async () => {
      const errors = await validateInput(OperationBankWithdrawInput, {
        ...validPayload,
        amount: "0.00",
      });
      const constraints = constraintsFor(errors, "amount");
      expect(constraints).toContain("matches");
      expect(constraints).toContain("isNotZero");
    });

    it.each(["100", "abc"])("rejeita formato inválido: %s", async (value) => {
      const errors = await validateInput(OperationBankWithdrawInput, {
        ...validPayload,
        amount: value,
      });
      expect(constraintsFor(errors, "amount")).toContain("matches");
    });

    it("rejeita quando ausente", async () => {
      const { amount, ...payload } = validPayload;
      const errors = await validateInput(OperationBankWithdrawInput, payload);
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });
  });
});

// ============================================================
// OperationGenericBankTransferInput
// ============================================================
describe("OperationGenericBankTransferInput", () => {
  const validPayload = {
    fromGenericBankId: UUID,
    toGenericBankId: UUID_2,
    amount: "100.00",
    typeOperation: GenericBankTransferEnum.TRANSFER,
    local: LocalEnum.INTERNAL,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(
        OperationGenericBankTransferInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("aceita toGenericBankId omitido (opcional)", async () => {
      const { toGenericBankId, ...payload } = validPayload;
      const errors = await validateInput(
        OperationGenericBankTransferInput,
        payload
      );
      expect(errors).toHaveLength(0);
    });

    it("aceita todos os valores do enum GenericBankTransferEnum", async () => {
      for (const typeOperation of Object.values(GenericBankTransferEnum)) {
        const errors = await validateInput(OperationGenericBankTransferInput, {
          ...validPayload,
          typeOperation,
        });
        expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
      }
    });

    it("aceita todos os valores do enum LocalEnum", async () => {
      for (const local of Object.values(LocalEnum)) {
        const errors = await validateInput(OperationGenericBankTransferInput, {
          ...validPayload,
          local,
        });
        expect(constraintsFor(errors, "local")).toHaveLength(0);
      }
    });

    it("aceita amount negativo (allow_negatives: true)", async () => {
      const errors = await validateInput(OperationGenericBankTransferInput, {
        ...validPayload,
        amount: "-100.00",
      });
      expect(constraintsFor(errors, "amount")).toHaveLength(0);
    });
  });

  describe("fromGenericBankId", () => {
    it("rejeita string não UUID", async () => {
      const errors = await validateInput(OperationGenericBankTransferInput, {
        ...validPayload,
        fromGenericBankId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "fromGenericBankId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { fromGenericBankId, ...payload } = validPayload;
      const errors = await validateInput(
        OperationGenericBankTransferInput,
        payload
      );
      expect(constraintsFor(errors, "fromGenericBankId")).toContain("isUuid");
    });
  });

  describe("toGenericBankId (opcional)", () => {
    it("rejeita string não UUID quando presente", async () => {
      const errors = await validateInput(OperationGenericBankTransferInput, {
        ...validPayload,
        toGenericBankId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "toGenericBankId")).toContain("isUuid");
    });

    it("aceita undefined (omitido)", async () => {
      const { toGenericBankId, ...payload } = validPayload;
      const errors = await validateInput(
        OperationGenericBankTransferInput,
        payload
      );
      expect(constraintsFor(errors, "toGenericBankId")).toHaveLength(0);
    });
  });

  describe("amount", () => {
    it("rejeita zero (isNotZero)", async () => {
      const errors = await validateInput(OperationGenericBankTransferInput, {
        ...validPayload,
        amount: "0.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("isNotZero");
    });

    it("rejeita formato inválido", async () => {
      const errors = await validateInput(OperationGenericBankTransferInput, {
        ...validPayload,
        amount: "abc",
      });
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });

    it("rejeita quando ausente", async () => {
      const { amount, ...payload } = validPayload;
      const errors = await validateInput(
        OperationGenericBankTransferInput,
        payload
      );
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });
  });

  describe("typeOperation", () => {
    it("rejeita valor fora do enum", async () => {
      const errors = await validateInput(OperationGenericBankTransferInput, {
        ...validPayload,
        typeOperation: "INVALIDO" as unknown as GenericBankTransferEnum,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });

    it("rejeita quando ausente", async () => {
      const { typeOperation, ...payload } = validPayload;
      const errors = await validateInput(
        OperationGenericBankTransferInput,
        payload
      );
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });
  });

  describe("local", () => {
    it("rejeita valor fora do enum", async () => {
      const errors = await validateInput(OperationGenericBankTransferInput, {
        ...validPayload,
        local: "INVALIDO" as unknown as LocalEnum,
      });
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });

    it("rejeita quando ausente", async () => {
      const { local, ...payload } = validPayload;
      const errors = await validateInput(
        OperationGenericBankTransferInput,
        payload
      );
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });
  });
});

// ============================================================
// OperationGenericBankDepositInput
// ============================================================
describe("OperationGenericBankDepositInput", () => {
  const validPayload = {
    genericBankId: UUID,
    amount: "100.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(
        OperationGenericBankDepositInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("genericBankId", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(OperationGenericBankDepositInput, {
        ...validPayload,
        genericBankId: UUID,
      });
      expect(constraintsFor(errors, "genericBankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const errors = await validateInput(OperationGenericBankDepositInput, {
        ...validPayload,
        genericBankId: "550e8400-e29b-11d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(OperationGenericBankDepositInput, {
        ...validPayload,
        genericBankId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { genericBankId, ...payload } = validPayload;
      const errors = await validateInput(
        OperationGenericBankDepositInput,
        payload
      );
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(OperationGenericBankDepositInput, {
        ...validPayload,
        genericBankId: null as unknown as string,
      });
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });
  });

  describe("amount", () => {
    it("rejeita valor negativo", async () => {
      const errors = await validateInput(OperationGenericBankDepositInput, {
        ...validPayload,
        amount: "-100.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });

    it("rejeita zero (isNotZero)", async () => {
      const errors = await validateInput(OperationGenericBankDepositInput, {
        ...validPayload,
        amount: "0.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("isNotZero");
    });

    it("rejeita quando ausente", async () => {
      const { amount, ...payload } = validPayload;
      const errors = await validateInput(
        OperationGenericBankDepositInput,
        payload
      );
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });
  });
});

// ============================================================
// OperationGenericBankWithdrawInput
// ============================================================
describe("OperationGenericBankWithdrawInput", () => {
  const validPayload = {
    genericBankId: UUID,
    amount: "-100.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(
        OperationGenericBankWithdrawInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("genericBankId", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(OperationGenericBankWithdrawInput, {
        ...validPayload,
        genericBankId: UUID,
      });
      expect(constraintsFor(errors, "genericBankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const errors = await validateInput(OperationGenericBankWithdrawInput, {
        ...validPayload,
        genericBankId: "550e8400-e29b-11d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(OperationGenericBankWithdrawInput, {
        ...validPayload,
        genericBankId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { genericBankId, ...payload } = validPayload;
      const errors = await validateInput(
        OperationGenericBankWithdrawInput,
        payload
      );
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });
  });

  describe("amount (deve ser negativo)", () => {
    it("rejeita valor positivo (matches exige hífen)", async () => {
      const errors = await validateInput(OperationGenericBankWithdrawInput, {
        ...validPayload,
        amount: "100.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("matches");
    });

    it("rejeita zero (matches + isNotZero)", async () => {
      const errors = await validateInput(OperationGenericBankWithdrawInput, {
        ...validPayload,
        amount: "0.00",
      });
      const constraints = constraintsFor(errors, "amount");
      expect(constraints).toContain("matches");
      expect(constraints).toContain("isNotZero");
    });

    it("rejeita quando ausente", async () => {
      const { amount, ...payload } = validPayload;
      const errors = await validateInput(
        OperationGenericBankWithdrawInput,
        payload
      );
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });
  });
});

// ============================================================
// OperationMoneyDepositInput  ← NOVO
// ============================================================
describe("OperationMoneyDepositInput", () => {
  const validPayload = {
    moneyId: UUID,
    amount: "100.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(
        OperationMoneyDepositInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("aceita valores positivos grandes", async () => {
      const errors = await validateInput(OperationMoneyDepositInput, {
        ...validPayload,
        amount: "1,234,567.89",
      });
      expect(constraintsFor(errors, "amount")).toHaveLength(0);
    });
  });

  describe("moneyId", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(OperationMoneyDepositInput, {
        ...validPayload,
        moneyId: UUID,
      });
      expect(constraintsFor(errors, "moneyId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const errors = await validateInput(OperationMoneyDepositInput, {
        ...validPayload,
        moneyId: "550e8400-e29b-11d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(OperationMoneyDepositInput, {
        ...validPayload,
        moneyId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { moneyId, ...payload } = validPayload;
      const errors = await validateInput(OperationMoneyDepositInput, payload);
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(OperationMoneyDepositInput, {
        ...validPayload,
        moneyId: null as unknown as string,
      });
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });
  });

  describe("amount", () => {
    it("rejeita valor negativo (allow_negatives: false)", async () => {
      const errors = await validateInput(OperationMoneyDepositInput, {
        ...validPayload,
        amount: "-100.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });

    it("rejeita zero (isNotZero)", async () => {
      const errors = await validateInput(OperationMoneyDepositInput, {
        ...validPayload,
        amount: "0.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("isNotZero");
    });

    it.each(["100", "abc", "100.5"])(
      "rejeita formato sem decimais/ inválido: %s",
      async (value) => {
        const errors = await validateInput(OperationMoneyDepositInput, {
          ...validPayload,
          amount: value,
        });
        expect(constraintsFor(errors, "amount")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente", async () => {
      const { amount, ...payload } = validPayload;
      const errors = await validateInput(OperationMoneyDepositInput, payload);
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });
  });
});

// ============================================================
// OperationMoneyWithdrawInput  ← NOVO
// ============================================================
describe("OperationMoneyWithdrawInput", () => {
  const validPayload = {
    moneyId: UUID,
    amount: "-100.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(
        OperationMoneyWithdrawInput,
        validPayload
      );
      expect(errors).toHaveLength(0);
    });

    it("aceita valores negativos grandes", async () => {
      const errors = await validateInput(OperationMoneyWithdrawInput, {
        ...validPayload,
        amount: "-1,234,567.89",
      });
      expect(constraintsFor(errors, "amount")).toHaveLength(0);
    });
  });

  describe("moneyId", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(OperationMoneyWithdrawInput, {
        ...validPayload,
        moneyId: UUID,
      });
      expect(constraintsFor(errors, "moneyId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const errors = await validateInput(OperationMoneyWithdrawInput, {
        ...validPayload,
        moneyId: "550e8400-e29b-11d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(OperationMoneyWithdrawInput, {
        ...validPayload,
        moneyId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { moneyId, ...payload } = validPayload;
      const errors = await validateInput(OperationMoneyWithdrawInput, payload);
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(OperationMoneyWithdrawInput, {
        ...validPayload,
        moneyId: null as unknown as string,
      });
      expect(constraintsFor(errors, "moneyId")).toContain("isUuid");
    });
  });

  describe("amount (deve ser negativo)", () => {
    it("rejeita valor positivo (matches exige hífen)", async () => {
      const errors = await validateInput(OperationMoneyWithdrawInput, {
        ...validPayload,
        amount: "100.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("matches");
    });

    it("rejeita zero (matches + isNotZero)", async () => {
      const errors = await validateInput(OperationMoneyWithdrawInput, {
        ...validPayload,
        amount: "0.00",
      });
      const constraints = constraintsFor(errors, "amount");
      expect(constraints).toContain("matches");
      expect(constraints).toContain("isNotZero");
    });

    it.each(["100", "abc"])("rejeita formato inválido: %s", async (value) => {
      const errors = await validateInput(OperationMoneyWithdrawInput, {
        ...validPayload,
        amount: value,
      });
      expect(constraintsFor(errors, "amount")).toContain("matches");
    });

    it("rejeita quando ausente", async () => {
      const { amount, ...payload } = validPayload;
      const errors = await validateInput(OperationMoneyWithdrawInput, payload);
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });
  });
});

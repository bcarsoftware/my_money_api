import "reflect-metadata";

import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import {
  BankBoxVerify,
  BankDepositVerify,
  BankTransferVerify,
  BankWithdrawVerify,
  GenericBankVerify,
  InvoiceVerify,
  MoneyReceiveVerify,
  MoneySendVerify,
  MoneyTransferVerify,
  MoneyVerify,
  PaymentVerify,
} from "@/resolvers/operations/utils/OperationVerify";
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

// ============================================================
// BankTransferVerify
// ============================================================
describe("BankTransferVerify", () => {
  // ... (mantido igual)
});

// ============================================================
// MoneyTransferVerify
// ============================================================
describe("MoneyTransferVerify", () => {
  // ... (mantido igual)
});

// ============================================================
// BankDepositVerify
// ============================================================
describe("BankDepositVerify", () => {
  // ... (mantido igual)
});

// ============================================================
// BankWithdrawVerify
// ============================================================
describe("BankWithdrawVerify", () => {
  // ... (mantido igual)
});

// ============================================================
// MoneySendVerify
// ============================================================
describe("MoneySendVerify", () => {
  // ... (mantido igual)
});

// ============================================================
// MoneyReceiveVerify
// ============================================================
describe("MoneyReceiveVerify", () => {
  // ... (mantido igual)
});

// ============================================================
// PaymentVerify
// ============================================================
describe("PaymentVerify", () => {
  // ... (mantido igual)
});

// ============================================================
// InvoiceVerify
// ============================================================
describe("InvoiceVerify", () => {
  // ... (mantido igual)
});

// ============================================================
// BankBoxVerify
// ============================================================
describe("BankBoxVerify", () => {
  // ... (mantido igual)
});

// ============================================================
// MoneyVerify
// ============================================================
describe("MoneyVerify", () => {
  // ... (mantido igual)
});

// ============================================================
// GenericBankVerify ← NOVO
// ============================================================
describe("GenericBankVerify", () => {
  const validPayload = {
    balance: "100.00",
    genericBankId: UUID,
    typeOperation: OperationEnum.DEPOSIT,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(GenericBankVerify, validPayload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("balance", () => {
    it("rejeita balance zero (isNotZero)", async () => {
      const errors = await validateInput(GenericBankVerify, {
        ...validPayload,
        balance: "0.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("isNotZero");
    });

    it("rejeita balance negativo (matches exige dígito inicial)", async () => {
      const errors = await validateInput(GenericBankVerify, {
        ...validPayload,
        balance: "-50.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("matches");
    });

    it("rejeita formato de moeda inválido", async () => {
      const errors = await validateInput(GenericBankVerify, {
        ...validPayload,
        balance: "nao-e-moeda",
      });
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita quando ausente", async () => {
      const { balance, ...payload } = validPayload;
      const errors = await validateInput(GenericBankVerify, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("genericBankId", () => {
    it("aceita UUID v4 válido", async () => {
      const errors = await validateInput(GenericBankVerify, {
        ...validPayload,
        genericBankId: UUID,
      });
      expect(constraintsFor(errors, "genericBankId")).toHaveLength(0);
    });

    it("rejeita UUID com versão diferente de 4", async () => {
      const errors = await validateInput(GenericBankVerify, {
        ...validPayload,
        genericBankId: "550e8400-e29b-11d4-a716-446655440000",
      });
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita string não UUID", async () => {
      const errors = await validateInput(GenericBankVerify, {
        ...validPayload,
        genericBankId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });

    it("rejeita quando ausente", async () => {
      const { genericBankId, ...payload } = validPayload;
      const errors = await validateInput(GenericBankVerify, payload);
      expect(constraintsFor(errors, "genericBankId")).toContain("isUuid");
    });
  });

  describe("typeOperation", () => {
    it.each([
      OperationEnum.DEPOSIT,
      OperationEnum.WITHDRAW,
      OperationEnum.TRANSFER,
    ])("aceita typeOperation = %s", async (typeOperation) => {
      const errors = await validateInput(GenericBankVerify, {
        ...validPayload,
        typeOperation,
      });
      expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
    });

    it.each([
      OperationEnum.PAYMENT,
      OperationEnum.PIX,
      OperationEnum.DOC,
      OperationEnum.TED,
      OperationEnum.SEND,
      OperationEnum.RECEIVE,
    ])("rejeita typeOperation = %s (isIn)", async (typeOperation) => {
      const errors = await validateInput(GenericBankVerify, {
        ...validPayload,
        typeOperation,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("isIn");
    });

    it("rejeita quando ausente (isIn)", async () => {
      const { typeOperation, ...payload } = validPayload;
      const errors = await validateInput(GenericBankVerify, payload);
      expect(constraintsFor(errors, "typeOperation")).toContain("isIn");
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros de diferentes campos", async () => {
      const payload = {
        balance: "-50.00",
        genericBankId: "nao-e-uuid",
        typeOperation: OperationEnum.PAYMENT,
      };
      const errors = await validateInput(GenericBankVerify, payload);
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(
        ["balance", "genericBankId", "typeOperation"].sort()
      );
    });
  });
});

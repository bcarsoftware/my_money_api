import "reflect-metadata";

import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import {
  BankDepositVerify,
  BankTransferVerify,
  BankVerify,
  BankWithdrawalVerify,
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
  const validPayload = {
    balance: "100.00",
    amount: "50.00",
    originBankId: UUID,
    destinationBankId: UUID_2,
    local: LocalEnum.INTERNAL,
    operationType: OperationEnum.TRANSFER,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(BankTransferVerify, validPayload);
      expect(errors).toHaveLength(0);
    });

    it("aceita balance e amount negativos (allow_negatives: true)", async () => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        balance: "-100.00",
        amount: "-50.00",
      });
      expect(errors).toHaveLength(0);
    });

    it("aceita discount e forfeit como null", async () => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        discount: null,
        forfeit: null,
      });
      expect(errors).toHaveLength(0);
    });

    it("aceita discount e forfeit como undefined (omitidos)", async () => {
      const errors = await validateInput(BankTransferVerify, validPayload);
      expect(constraintsFor(errors, "discount")).toHaveLength(0);
      expect(constraintsFor(errors, "forfeit")).toHaveLength(0);
    });

    it("aceita destinationBankId omitido (opcional)", async () => {
      const { destinationBankId, ...payload } = validPayload;
      const errors = await validateInput(BankTransferVerify, payload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("balance", () => {
    it("rejeita formato de moeda inválido", async () => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        balance: "não é moeda",
      });
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita zero (isNotZero)", async () => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        balance: "0.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("isNotZero");
    });

    it("rejeita quando ausente", async () => {
      const { balance, ...payload } = validPayload;
      const errors = await validateInput(BankTransferVerify, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("amount", () => {
    it("rejeita formato de moeda inválido", async () => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        amount: "100.5",
      });
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });

    it("rejeita zero (isNotZero)", async () => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        amount: "0",
      });
      expect(constraintsFor(errors, "amount")).toContain("isNotZero");
    });

    it("rejeita quando ausente", async () => {
      const { amount, ...payload } = validPayload;
      const errors = await validateInput(BankTransferVerify, payload);
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });

    // Regex atual: strings compostas só de 0, . e , são tratadas como zero.
    it.each(["00.0.0", "0.0.0", "0,0", ".,", "..."])(
      "trata %s como zero (isCurrency + isNotZero)",
      async (amount) => {
        const errors = await validateInput(BankTransferVerify, {
          ...validPayload,
          amount,
        });
        const constraints = constraintsFor(errors, "amount");
        expect(constraints).toContain("isCurrency");
        expect(constraints).toContain("isNotZero");
      }
    );

    // Contraprova: valores com caractere não-zero permanecem válidos para o isNotZero.
    it.each(["100", "0.01", "-0", "1.0"])(
      "não trata %s como zero",
      async (amount) => {
        const errors = await validateInput(BankTransferVerify, {
          ...validPayload,
          amount,
        });
        expect(constraintsFor(errors, "amount")).not.toContain("isNotZero");
      }
    );
  });

  describe("discount / forfeit", () => {
    it("rejeita discount preenchido com valor", async () => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        discount: "10.00",
      });
      expect(constraintsFor(errors, "discount")).toContain("isIn");
    });

    it("rejeita forfeit preenchido com valor", async () => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        forfeit: "5.00",
      });
      expect(constraintsFor(errors, "forfeit")).toContain("isIn");
    });
  });

  describe("originBankId / destinationBankId", () => {
    it("rejeita originBankId não UUID", async () => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        originBankId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "originBankId")).toContain("isUuid");
    });

    it("rejeita destinationBankId não UUID quando presente", async () => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        destinationBankId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "destinationBankId")).toContain("isUuid");
    });

    it("rejeita originBankId ausente", async () => {
      const { originBankId, ...payload } = validPayload;
      const errors = await validateInput(BankTransferVerify, payload);
      expect(constraintsFor(errors, "originBankId")).toContain("isUuid");
    });
  });

  describe("local", () => {
    it("rejeita valor fora do enum", async () => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        local: "INVALIDO" as unknown as LocalEnum,
      });
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });
  });

  describe("operationType", () => {
    it.each([
      OperationEnum.PAYMENT,
      OperationEnum.TRANSFER,
      OperationEnum.PIX,
      OperationEnum.DOC,
      OperationEnum.TED,
    ])("aceita operationType = %s", async (operationType) => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        operationType,
      });
      expect(constraintsFor(errors, "operationType")).toHaveLength(0);
    });

    it.each([
      OperationEnum.DEPOSIT,
      OperationEnum.WITHDRAWAL,
      OperationEnum.SEND,
      OperationEnum.RECEIVE,
    ])("rejeita operationType = %s", async (operationType) => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        operationType,
      });
      expect(constraintsFor(errors, "operationType")).toContain("isIn");
    });
  });
});

// ============================================================
// MoneyTransferVerify
// ============================================================
describe("MoneyTransferVerify", () => {
  const validPayload = {
    balance: "100.00",
    amount: "50.00",
    originMoneyId: UUID,
    destinationMoneyId: UUID_2,
    local: LocalEnum.INTERNAL,
    operationType: OperationEnum.SEND,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(MoneyTransferVerify, validPayload);
      expect(errors).toHaveLength(0);
    });

    it("aceita destinationMoneyId omitido (opcional)", async () => {
      const { destinationMoneyId, ...payload } = validPayload;
      const errors = await validateInput(MoneyTransferVerify, payload);
      expect(errors).toHaveLength(0);
    });

    it("aceita discount e forfeit como null", async () => {
      const errors = await validateInput(MoneyTransferVerify, {
        ...validPayload,
        discount: null,
        forfeit: null,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("balance / amount", () => {
    it("rejeita zero em balance", async () => {
      const errors = await validateInput(MoneyTransferVerify, {
        ...validPayload,
        balance: "0.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("isNotZero");
    });

    it("rejeita zero em amount", async () => {
      const errors = await validateInput(MoneyTransferVerify, {
        ...validPayload,
        amount: "0.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("isNotZero");
    });
  });

  describe("discount / forfeit", () => {
    it("rejeita discount com valor", async () => {
      const errors = await validateInput(MoneyTransferVerify, {
        ...validPayload,
        discount: "10.00",
      });
      expect(constraintsFor(errors, "discount")).toContain("isIn");
    });

    it("rejeita forfeit com valor", async () => {
      const errors = await validateInput(MoneyTransferVerify, {
        ...validPayload,
        forfeit: "5.00",
      });
      expect(constraintsFor(errors, "forfeit")).toContain("isIn");
    });
  });

  describe("originMoneyId / destinationMoneyId", () => {
    it("rejeita originMoneyId não UUID", async () => {
      const errors = await validateInput(MoneyTransferVerify, {
        ...validPayload,
        originMoneyId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "originMoneyId")).toContain("isUuid");
    });

    it("rejeita destinationMoneyId não UUID quando presente", async () => {
      const errors = await validateInput(MoneyTransferVerify, {
        ...validPayload,
        destinationMoneyId: "nao-e-uuid",
      });
      expect(constraintsFor(errors, "destinationMoneyId")).toContain("isUuid");
    });

    it("rejeita originMoneyId ausente", async () => {
      const { originMoneyId, ...payload } = validPayload;
      const errors = await validateInput(MoneyTransferVerify, payload);
      expect(constraintsFor(errors, "originMoneyId")).toContain("isUuid");
    });
  });

  describe("local", () => {
    it("rejeita valor fora do enum", async () => {
      const errors = await validateInput(MoneyTransferVerify, {
        ...validPayload,
        local: "INVALIDO" as unknown as LocalEnum,
      });
      expect(constraintsFor(errors, "local")).toContain("isEnum");
    });
  });

  describe("operationType", () => {
    it.each([
      OperationEnum.SEND,
      OperationEnum.RECEIVE,
      OperationEnum.TRANSFER,
      OperationEnum.PAYMENT,
    ])("aceita operationType = %s", async (operationType) => {
      const errors = await validateInput(MoneyTransferVerify, {
        ...validPayload,
        operationType,
      });
      expect(constraintsFor(errors, "operationType")).toHaveLength(0);
    });

    it.each([
      OperationEnum.DEPOSIT,
      OperationEnum.WITHDRAWAL,
      OperationEnum.PIX,
      OperationEnum.DOC,
      OperationEnum.TED,
    ])("rejeita operationType = %s", async (operationType) => {
      const errors = await validateInput(MoneyTransferVerify, {
        ...validPayload,
        operationType,
      });
      expect(constraintsFor(errors, "operationType")).toContain("isIn");
    });
  });
});

// ============================================================
// BankDepositVerify
// ============================================================
describe("BankDepositVerify", () => {
  const validPayload = {
    balance: "100.00",
    amount: "50.00",
    operationType: OperationEnum.DEPOSIT,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(BankDepositVerify, validPayload);
      expect(errors).toHaveLength(0);
    });

    it("aceita discount e forfeit como null", async () => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        discount: null,
        forfeit: null,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("balance", () => {
    it("rejeita balance negativo (isCurrency + matches)", async () => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        balance: "-50.00",
      });
      const constraints = constraintsFor(errors, "balance");
      expect(constraints).toContain("isCurrency");
      expect(constraints).toContain("matches");
    });

    it("rejeita balance zero (isNotZero)", async () => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        balance: "0.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("isNotZero");
    });

    it("rejeita formato inválido", async () => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        balance: "nao-e-moeda",
      });
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("aceita valor positivo", async () => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        balance: "1.00",
      });
      expect(constraintsFor(errors, "balance")).toHaveLength(0);
    });
  });

  describe("amount", () => {
    it("rejeita amount negativo (isCurrency + matches)", async () => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        amount: "-50.00",
      });
      const constraints = constraintsFor(errors, "amount");
      expect(constraints).toContain("isCurrency");
      expect(constraints).toContain("matches");
    });

    it("rejeita amount zero (isNotZero)", async () => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        amount: "0",
      });
      expect(constraintsFor(errors, "amount")).toContain("isNotZero");
    });

    it("aceita amount positivo", async () => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        amount: "1.00",
      });
      expect(constraintsFor(errors, "amount")).toHaveLength(0);
    });
  });

  describe("discount / forfeit", () => {
    it("rejeita discount com valor", async () => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        discount: "10.00",
      });
      expect(constraintsFor(errors, "discount")).toContain("isIn");
    });

    it("rejeita forfeit com valor", async () => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        forfeit: "5.00",
      });
      expect(constraintsFor(errors, "forfeit")).toContain("isIn");
    });
  });

  describe("operationType", () => {
    it("aceita apenas DEPOSIT", async () => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        operationType: OperationEnum.DEPOSIT,
      });
      expect(constraintsFor(errors, "operationType")).toHaveLength(0);
    });

    it.each([
      OperationEnum.WITHDRAWAL,
      OperationEnum.PIX,
      OperationEnum.TRANSFER,
      OperationEnum.TED,
    ])("rejeita operationType = %s (equals)", async (operationType) => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        operationType,
      });
      expect(constraintsFor(errors, "operationType")).toContain("equals");
    });
  });
});

// ============================================================
// BankWithdrawalVerify
// ============================================================
describe("BankWithdrawalVerify", () => {
  const validPayload = {
    balance: "-100.00",
    amount: "-50.00",
    operationType: OperationEnum.WITHDRAWAL,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(BankWithdrawalVerify, validPayload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("balance (deve ser negativo)", () => {
    it("rejeita balance positivo (matches)", async () => {
      const errors = await validateInput(BankWithdrawalVerify, {
        ...validPayload,
        balance: "100.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("matches");
    });

    it("rejeita balance zero (matches + isNotZero)", async () => {
      const errors = await validateInput(BankWithdrawalVerify, {
        ...validPayload,
        balance: "0.00",
      });
      const constraints = constraintsFor(errors, "balance");
      expect(constraints).toContain("matches");
      expect(constraints).toContain("isNotZero");
    });

    it("aceita valor negativo", async () => {
      const errors = await validateInput(BankWithdrawalVerify, {
        ...validPayload,
        balance: "-1.00",
      });
      expect(constraintsFor(errors, "balance")).toHaveLength(0);
    });
  });

  describe("amount (deve ser negativo)", () => {
    it("rejeita amount positivo (matches)", async () => {
      const errors = await validateInput(BankWithdrawalVerify, {
        ...validPayload,
        amount: "50.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("matches");
    });

    it("rejeita amount zero (matches + isNotZero)", async () => {
      const errors = await validateInput(BankWithdrawalVerify, {
        ...validPayload,
        amount: "0.00",
      });
      const constraints = constraintsFor(errors, "amount");
      expect(constraints).toContain("matches");
      expect(constraints).toContain("isNotZero");
    });
  });

  describe("discount / forfeit", () => {
    it("rejeita discount com valor", async () => {
      const errors = await validateInput(BankWithdrawalVerify, {
        ...validPayload,
        discount: "10.00",
      });
      expect(constraintsFor(errors, "discount")).toContain("isIn");
    });

    it("rejeita forfeit com valor", async () => {
      const errors = await validateInput(BankWithdrawalVerify, {
        ...validPayload,
        forfeit: "5.00",
      });
      expect(constraintsFor(errors, "forfeit")).toContain("isIn");
    });
  });

  describe("operationType", () => {
    it("aceita apenas WITHDRAWAL", async () => {
      const errors = await validateInput(BankWithdrawalVerify, {
        ...validPayload,
        operationType: OperationEnum.WITHDRAWAL,
      });
      expect(constraintsFor(errors, "operationType")).toHaveLength(0);
    });

    it.each([OperationEnum.DEPOSIT, OperationEnum.TRANSFER, OperationEnum.PIX])(
      "rejeita operationType = %s (equals)",
      async (operationType) => {
        const errors = await validateInput(BankWithdrawalVerify, {
          ...validPayload,
          operationType,
        });
        expect(constraintsFor(errors, "operationType")).toContain("equals");
      }
    );
  });
});

// ============================================================
// MoneySendVerify
// ============================================================
describe("MoneySendVerify", () => {
  const validPayload = {
    balance: "-100.00",
    amount: "-50.00",
    operationType: OperationEnum.SEND,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(MoneySendVerify, validPayload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("balance / amount (devem ser negativos)", () => {
    it("rejeita balance positivo (matches)", async () => {
      const errors = await validateInput(MoneySendVerify, {
        ...validPayload,
        balance: "100.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("matches");
    });

    it("rejeita amount positivo (matches)", async () => {
      const errors = await validateInput(MoneySendVerify, {
        ...validPayload,
        amount: "50.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("matches");
    });

    it("rejeita balance zero (matches + isNotZero)", async () => {
      const errors = await validateInput(MoneySendVerify, {
        ...validPayload,
        balance: "0.00",
      });
      const constraints = constraintsFor(errors, "balance");
      expect(constraints).toContain("matches");
      expect(constraints).toContain("isNotZero");
    });
  });

  describe("discount / forfeit", () => {
    it("rejeita discount com valor", async () => {
      const errors = await validateInput(MoneySendVerify, {
        ...validPayload,
        discount: "10.00",
      });
      expect(constraintsFor(errors, "discount")).toContain("isIn");
    });

    it("rejeita forfeit com valor", async () => {
      const errors = await validateInput(MoneySendVerify, {
        ...validPayload,
        forfeit: "5.00",
      });
      expect(constraintsFor(errors, "forfeit")).toContain("isIn");
    });
  });

  describe("operationType", () => {
    it("aceita apenas SEND", async () => {
      const errors = await validateInput(MoneySendVerify, {
        ...validPayload,
        operationType: OperationEnum.SEND,
      });
      expect(constraintsFor(errors, "operationType")).toHaveLength(0);
    });

    it.each([
      OperationEnum.RECEIVE,
      OperationEnum.TRANSFER,
      OperationEnum.PAYMENT,
    ])("rejeita operationType = %s (equals)", async (operationType) => {
      const errors = await validateInput(MoneySendVerify, {
        ...validPayload,
        operationType,
      });
      expect(constraintsFor(errors, "operationType")).toContain("equals");
    });
  });
});

// ============================================================
// MoneyReceiveVerify
// ============================================================
describe("MoneyReceiveVerify", () => {
  const validPayload = {
    balance: "100.00",
    amount: "50.00",
    operationType: OperationEnum.RECEIVE,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(MoneyReceiveVerify, validPayload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("balance (positivo)", () => {
    it("rejeita balance negativo (isCurrency + matches)", async () => {
      const errors = await validateInput(MoneyReceiveVerify, {
        ...validPayload,
        balance: "-50.00",
      });
      const constraints = constraintsFor(errors, "balance");
      expect(constraints).toContain("isCurrency");
      expect(constraints).toContain("matches");
    });

    it("rejeita balance zero (isNotZero)", async () => {
      const errors = await validateInput(MoneyReceiveVerify, {
        ...validPayload,
        balance: "0.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("isNotZero");
    });
  });

  describe("amount (positivo)", () => {
    it("rejeita amount negativo (isCurrency + matches)", async () => {
      const errors = await validateInput(MoneyReceiveVerify, {
        ...validPayload,
        amount: "-50.00",
      });
      const constraints = constraintsFor(errors, "amount");
      expect(constraints).toContain("isCurrency");
      expect(constraints).toContain("matches");
    });

    it("rejeita amount zero (isNotZero)", async () => {
      const errors = await validateInput(MoneyReceiveVerify, {
        ...validPayload,
        amount: "0.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("isNotZero");
    });
  });

  describe("discount / forfeit", () => {
    it("rejeita discount com valor", async () => {
      const errors = await validateInput(MoneyReceiveVerify, {
        ...validPayload,
        discount: "10.00",
      });
      expect(constraintsFor(errors, "discount")).toContain("isIn");
    });

    it("rejeita forfeit com valor", async () => {
      const errors = await validateInput(MoneyReceiveVerify, {
        ...validPayload,
        forfeit: "5.00",
      });
      expect(constraintsFor(errors, "forfeit")).toContain("isIn");
    });
  });

  describe("operationType", () => {
    it("aceita apenas RECEIVE", async () => {
      const errors = await validateInput(MoneyReceiveVerify, {
        ...validPayload,
        operationType: OperationEnum.RECEIVE,
      });
      expect(constraintsFor(errors, "operationType")).toHaveLength(0);
    });

    it.each([
      OperationEnum.SEND,
      OperationEnum.TRANSFER,
      OperationEnum.PAYMENT,
    ])("rejeita operationType = %s (equals)", async (operationType) => {
      const errors = await validateInput(MoneyReceiveVerify, {
        ...validPayload,
        operationType,
      });
      expect(constraintsFor(errors, "operationType")).toContain("equals");
    });
  });
});

// ============================================================
// PaymentVerify
// ============================================================
describe("PaymentVerify", () => {
  const validPayload = {
    balance: "100.00",
    amount: "50.00",
    operationType: OperationEnum.PAYMENT,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(PaymentVerify, validPayload);
      expect(errors).toHaveLength(0);
    });

    it("aceita discount negativo", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        discount: "-10.00",
      });
      expect(errors).toHaveLength(0);
    });

    it("aceita forfeit positivo", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        forfeit: "5.00",
      });
      expect(errors).toHaveLength(0);
    });

    it("aceita discount e forfeit como null (opcionais)", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        discount: null,
        forfeit: null,
      });
      expect(errors).toHaveLength(0);
    });

    it("aceita discount e forfeit como undefined (omitidos)", async () => {
      const errors = await validateInput(PaymentVerify, validPayload);
      expect(constraintsFor(errors, "discount")).toHaveLength(0);
      expect(constraintsFor(errors, "forfeit")).toHaveLength(0);
    });
  });

  describe("balance", () => {
    it("rejeita balance negativo (isCurrency + matches)", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        balance: "-50.00",
      });
      const constraints = constraintsFor(errors, "balance");
      expect(constraints).toContain("isCurrency");
      expect(constraints).toContain("matches");
    });

    it("rejeita balance zero (isNotZero)", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        balance: "0.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("isNotZero");
    });

    it("rejeita quando ausente", async () => {
      const { balance, ...payload } = validPayload;
      const errors = await validateInput(PaymentVerify, payload);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("amount", () => {
    it("rejeita amount negativo (isCurrency + matches)", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        amount: "-50.00",
      });
      const constraints = constraintsFor(errors, "amount");
      expect(constraints).toContain("isCurrency");
      expect(constraints).toContain("matches");
    });

    it("rejeita amount zero (isNotZero)", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        amount: "0.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("isNotZero");
    });

    it("rejeita quando ausente", async () => {
      const { amount, ...payload } = validPayload;
      const errors = await validateInput(PaymentVerify, payload);
      expect(constraintsFor(errors, "amount")).toContain("isCurrency");
    });
  });

  describe("discount (deve ser negativo quando presente)", () => {
    it("rejeita discount positivo (matches)", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        discount: "10.00",
      });
      expect(constraintsFor(errors, "discount")).toContain("matches");
    });

    it("rejeita discount zero (matches)", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        discount: "0.00",
      });
      expect(constraintsFor(errors, "discount")).toContain("matches");
    });

    it("rejeita discount com formato de moeda inválido", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        discount: "nao-e-moeda",
      });
      expect(constraintsFor(errors, "discount")).toContain("isCurrency");
    });
  });

  describe("forfeit (deve ser positivo quando presente)", () => {
    it("rejeita forfeit negativo (isCurrency + matches)", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        forfeit: "-5.00",
      });
      const constraints = constraintsFor(errors, "forfeit");
      expect(constraints).toContain("isCurrency");
      expect(constraints).toContain("matches");
    });
  });

  describe("operationType", () => {
    it("aceita apenas PAYMENT", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        operationType: OperationEnum.PAYMENT,
      });
      expect(constraintsFor(errors, "operationType")).toHaveLength(0);
    });

    it.each([
      OperationEnum.TRANSFER,
      OperationEnum.PIX,
      OperationEnum.DEPOSIT,
      OperationEnum.WITHDRAWAL,
    ])("rejeita operationType = %s (equals)", async (operationType) => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        operationType,
      });
      expect(constraintsFor(errors, "operationType")).toContain("equals");
    });

    it("rejeita quando ausente (isEnum)", async () => {
      const { operationType, ...payload } = validPayload;
      const errors = await validateInput(PaymentVerify, payload);
      expect(constraintsFor(errors, "operationType")).toContain("isEnum");
    });
  });
});

// ============================================================
// BankVerify
// ============================================================
describe("BankVerify", () => {
  describe("operationType", () => {
    it.each([
      OperationEnum.DEPOSIT,
      OperationEnum.WITHDRAWAL,
      OperationEnum.TRANSFER,
      OperationEnum.PAYMENT,
      OperationEnum.PIX,
      OperationEnum.DOC,
      OperationEnum.TED,
    ])("aceita operationType = %s", async (operationType) => {
      const errors = await validateInput(BankVerify, { operationType });
      expect(constraintsFor(errors, "operationType")).toHaveLength(0);
    });

    it.each([OperationEnum.SEND, OperationEnum.RECEIVE])(
      "rejeita operationType = %s (isIn)",
      async (operationType) => {
        const errors = await validateInput(BankVerify, { operationType });
        expect(constraintsFor(errors, "operationType")).toContain("isIn");
      }
    );

    it("rejeita quando ausente (isIn)", async () => {
      const errors = await validateInput(BankVerify, {});
      expect(constraintsFor(errors, "operationType")).toContain("isIn");
    });
  });
});

// ============================================================
// MoneyVerify
// ============================================================
describe("MoneyVerify", () => {
  describe("operationType", () => {
    it.each([
      OperationEnum.SEND,
      OperationEnum.RECEIVE,
      OperationEnum.TRANSFER,
      OperationEnum.PAYMENT,
    ])("aceita operationType = %s", async (operationType) => {
      const errors = await validateInput(MoneyVerify, { operationType });
      expect(constraintsFor(errors, "operationType")).toHaveLength(0);
    });

    it.each([
      OperationEnum.DEPOSIT,
      OperationEnum.WITHDRAWAL,
      OperationEnum.PIX,
      OperationEnum.DOC,
      OperationEnum.TED,
    ])("rejeita operationType = %s (isIn)", async (operationType) => {
      const errors = await validateInput(MoneyVerify, { operationType });
      expect(constraintsFor(errors, "operationType")).toContain("isIn");
    });

    it("rejeita quando ausente (isIn)", async () => {
      const errors = await validateInput(MoneyVerify, {});
      expect(constraintsFor(errors, "operationType")).toContain("isIn");
    });
  });
});

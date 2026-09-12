import "reflect-metadata";

import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import {
  BankDepositVerify,
  BankTransferVerify,
  BankVerify,
  BankWithdrawVerify,
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
    typeOperation: OperationEnum.TRANSFER,
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

  describe("typeOperation", () => {
    it.each([
      OperationEnum.PAYMENT,
      OperationEnum.TRANSFER,
      OperationEnum.PIX,
      OperationEnum.DOC,
      OperationEnum.TED,
    ])("aceita typeOperation = %s", async (typeOperation) => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        typeOperation,
      });
      expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
    });

    it.each([
      OperationEnum.DEPOSIT,
      OperationEnum.WITHDRAW,
      OperationEnum.SEND,
      OperationEnum.RECEIVE,
    ])("rejeita typeOperation = %s", async (typeOperation) => {
      const errors = await validateInput(BankTransferVerify, {
        ...validPayload,
        typeOperation,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("isIn");
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
    typeOperation: OperationEnum.SEND,
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

  describe("typeOperation", () => {
    it.each([
      OperationEnum.SEND,
      OperationEnum.RECEIVE,
      OperationEnum.TRANSFER,
      OperationEnum.PAYMENT,
    ])("aceita typeOperation = %s", async (typeOperation) => {
      const errors = await validateInput(MoneyTransferVerify, {
        ...validPayload,
        typeOperation,
      });
      expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
    });

    it.each([
      OperationEnum.DEPOSIT,
      OperationEnum.WITHDRAW,
      OperationEnum.PIX,
      OperationEnum.DOC,
      OperationEnum.TED,
    ])("rejeita typeOperation = %s", async (typeOperation) => {
      const errors = await validateInput(MoneyTransferVerify, {
        ...validPayload,
        typeOperation,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("isIn");
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
    typeOperation: OperationEnum.DEPOSIT,
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

  describe("typeOperation", () => {
    it("aceita apenas DEPOSIT", async () => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        typeOperation: OperationEnum.DEPOSIT,
      });
      expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
    });

    it.each([
      OperationEnum.WITHDRAW,
      OperationEnum.PIX,
      OperationEnum.TRANSFER,
      OperationEnum.TED,
    ])("rejeita typeOperation = %s (equals)", async (typeOperation) => {
      const errors = await validateInput(BankDepositVerify, {
        ...validPayload,
        typeOperation,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("equals");
    });
  });
});

// ============================================================
// BankWithdrawVerify
// ============================================================
describe("BankWithdrawVerify", () => {
  const validPayload = {
    balance: "-100.00",
    amount: "-50.00",
    typeOperation: OperationEnum.WITHDRAW,
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(BankWithdrawVerify, validPayload);
      expect(errors).toHaveLength(0);
    });
  });

  describe("balance (deve ser negativo)", () => {
    it("rejeita balance positivo (matches)", async () => {
      const errors = await validateInput(BankWithdrawVerify, {
        ...validPayload,
        balance: "100.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("matches");
    });

    it("rejeita balance zero (matches + isNotZero)", async () => {
      const errors = await validateInput(BankWithdrawVerify, {
        ...validPayload,
        balance: "0.00",
      });
      const constraints = constraintsFor(errors, "balance");
      expect(constraints).toContain("matches");
      expect(constraints).toContain("isNotZero");
    });

    it("aceita valor negativo", async () => {
      const errors = await validateInput(BankWithdrawVerify, {
        ...validPayload,
        balance: "-1.00",
      });
      expect(constraintsFor(errors, "balance")).toHaveLength(0);
    });
  });

  describe("amount (deve ser negativo)", () => {
    it("rejeita amount positivo (matches)", async () => {
      const errors = await validateInput(BankWithdrawVerify, {
        ...validPayload,
        amount: "50.00",
      });
      expect(constraintsFor(errors, "amount")).toContain("matches");
    });

    it("rejeita amount zero (matches + isNotZero)", async () => {
      const errors = await validateInput(BankWithdrawVerify, {
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
      const errors = await validateInput(BankWithdrawVerify, {
        ...validPayload,
        discount: "10.00",
      });
      expect(constraintsFor(errors, "discount")).toContain("isIn");
    });

    it("rejeita forfeit com valor", async () => {
      const errors = await validateInput(BankWithdrawVerify, {
        ...validPayload,
        forfeit: "5.00",
      });
      expect(constraintsFor(errors, "forfeit")).toContain("isIn");
    });
  });

  describe("typeOperation", () => {
    it("aceita apenas WITHDRAW", async () => {
      const errors = await validateInput(BankWithdrawVerify, {
        ...validPayload,
        typeOperation: OperationEnum.WITHDRAW,
      });
      expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
    });

    it.each([OperationEnum.DEPOSIT, OperationEnum.TRANSFER, OperationEnum.PIX])(
      "rejeita typeOperation = %s (equals)",
      async (typeOperation) => {
        const errors = await validateInput(BankWithdrawVerify, {
          ...validPayload,
          typeOperation,
        });
        expect(constraintsFor(errors, "typeOperation")).toContain("equals");
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
    typeOperation: OperationEnum.SEND,
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

  describe("typeOperation", () => {
    it("aceita apenas SEND", async () => {
      const errors = await validateInput(MoneySendVerify, {
        ...validPayload,
        typeOperation: OperationEnum.SEND,
      });
      expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
    });

    it.each([
      OperationEnum.RECEIVE,
      OperationEnum.TRANSFER,
      OperationEnum.PAYMENT,
    ])("rejeita typeOperation = %s (equals)", async (typeOperation) => {
      const errors = await validateInput(MoneySendVerify, {
        ...validPayload,
        typeOperation,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("equals");
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
    typeOperation: OperationEnum.RECEIVE,
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

  describe("typeOperation", () => {
    it("aceita apenas RECEIVE", async () => {
      const errors = await validateInput(MoneyReceiveVerify, {
        ...validPayload,
        typeOperation: OperationEnum.RECEIVE,
      });
      expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
    });

    it.each([
      OperationEnum.SEND,
      OperationEnum.TRANSFER,
      OperationEnum.PAYMENT,
    ])("rejeita typeOperation = %s (equals)", async (typeOperation) => {
      const errors = await validateInput(MoneyReceiveVerify, {
        ...validPayload,
        typeOperation,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("equals");
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
    typeOperation: OperationEnum.PAYMENT,
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

  describe("typeOperation", () => {
    it("aceita apenas PAYMENT", async () => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        typeOperation: OperationEnum.PAYMENT,
      });
      expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
    });

    it.each([
      OperationEnum.TRANSFER,
      OperationEnum.PIX,
      OperationEnum.DEPOSIT,
      OperationEnum.WITHDRAW,
    ])("rejeita typeOperation = %s (equals)", async (typeOperation) => {
      const errors = await validateInput(PaymentVerify, {
        ...validPayload,
        typeOperation,
      });
      expect(constraintsFor(errors, "typeOperation")).toContain("equals");
    });

    it("rejeita quando ausente (isEnum)", async () => {
      const { typeOperation, ...payload } = validPayload;
      const errors = await validateInput(PaymentVerify, payload);
      expect(constraintsFor(errors, "typeOperation")).toContain("isEnum");
    });
  });
});

// ============================================================
// BankVerify
// ============================================================
describe("BankVerify", () => {
  describe("typeOperation", () => {
    it.each([
      OperationEnum.DEPOSIT,
      OperationEnum.WITHDRAW,
      OperationEnum.TRANSFER,
      OperationEnum.PAYMENT,
      OperationEnum.PIX,
      OperationEnum.DOC,
      OperationEnum.TED,
    ])("aceita typeOperation = %s", async (typeOperation) => {
      const errors = await validateInput(BankVerify, { typeOperation });
      expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
    });

    it.each([OperationEnum.SEND, OperationEnum.RECEIVE])(
      "rejeita typeOperation = %s (isIn)",
      async (typeOperation) => {
        const errors = await validateInput(BankVerify, { typeOperation });
        expect(constraintsFor(errors, "typeOperation")).toContain("isIn");
      }
    );

    it("rejeita quando ausente (isIn)", async () => {
      const errors = await validateInput(BankVerify, {});
      expect(constraintsFor(errors, "typeOperation")).toContain("isIn");
    });
  });
});

// ============================================================
// MoneyVerify
// ============================================================
describe("MoneyVerify", () => {
  describe("typeOperation", () => {
    it.each([
      OperationEnum.SEND,
      OperationEnum.RECEIVE,
      OperationEnum.TRANSFER,
      OperationEnum.PAYMENT,
    ])("aceita typeOperation = %s", async (typeOperation) => {
      const errors = await validateInput(MoneyVerify, { typeOperation });
      expect(constraintsFor(errors, "typeOperation")).toHaveLength(0);
    });

    it.each([
      OperationEnum.DEPOSIT,
      OperationEnum.WITHDRAW,
      OperationEnum.PIX,
      OperationEnum.DOC,
      OperationEnum.TED,
    ])("rejeita typeOperation = %s (isIn)", async (typeOperation) => {
      const errors = await validateInput(MoneyVerify, { typeOperation });
      expect(constraintsFor(errors, "typeOperation")).toContain("isIn");
    });

    it("rejeita quando ausente (isIn)", async () => {
      const errors = await validateInput(MoneyVerify, {});
      expect(constraintsFor(errors, "typeOperation")).toContain("isIn");
    });
  });
});

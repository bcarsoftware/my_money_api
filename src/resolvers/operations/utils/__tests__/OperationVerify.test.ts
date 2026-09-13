import "reflect-metadata";

import { OperationEnum } from "@/enums/OperationEnum";
import {
  DepositVerify,
  DiscountForfeitOmitted,
  GenericBankVerify,
  WithdrawVerify,
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

// ============================================================
// DiscountForfeitOmitted ← NOVO
// ============================================================
describe("DiscountForfeitOmitted", () => {
  describe("caminho feliz", () => {
    it("não retorna erros quando ambos são omitidos", async () => {
      const errors = await validateInput(DiscountForfeitOmitted, {});
      expect(errors).toHaveLength(0);
    });

    it("aceita discount e forfeit como null", async () => {
      const errors = await validateInput(DiscountForfeitOmitted, {
        discount: null,
        forfeit: null,
      });
      expect(errors).toHaveLength(0);
    });

    it("aceita discount e forfeit como undefined explícitos", async () => {
      const errors = await validateInput(DiscountForfeitOmitted, {
        discount: undefined,
        forfeit: undefined,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("discount (deve ser null/undefined)", () => {
    it("rejeita discount com valor preenchido", async () => {
      const errors = await validateInput(DiscountForfeitOmitted, {
        discount: "10.00",
      });
      expect(constraintsFor(errors, "discount")).toContain("isIn");
    });

    it("rejeita discount vazio ('')", async () => {
      const errors = await validateInput(DiscountForfeitOmitted, {
        discount: "",
      });
      expect(constraintsFor(errors, "discount")).toContain("isIn");
    });

    it("rejeita discount com valor zero ('0.00')", async () => {
      const errors = await validateInput(DiscountForfeitOmitted, {
        discount: "0.00",
      });
      expect(constraintsFor(errors, "discount")).toContain("isIn");
    });
  });

  describe("forfeit (deve ser null/undefined)", () => {
    it("rejeita forfeit com valor preenchido", async () => {
      const errors = await validateInput(DiscountForfeitOmitted, {
        forfeit: "5.00",
      });
      expect(constraintsFor(errors, "forfeit")).toContain("isIn");
    });

    it("rejeita forfeit vazio ('')", async () => {
      const errors = await validateInput(DiscountForfeitOmitted, {
        forfeit: "",
      });
      expect(constraintsFor(errors, "forfeit")).toContain("isIn");
    });

    it("rejeita forfeit com valor zero ('0.00')", async () => {
      const errors = await validateInput(DiscountForfeitOmitted, {
        forfeit: "0.00",
      });
      expect(constraintsFor(errors, "forfeit")).toContain("isIn");
    });
  });

  describe("múltiplos erros", () => {
    it("acumula erros de discount e forfeit", async () => {
      const errors = await validateInput(DiscountForfeitOmitted, {
        discount: "10.00",
        forfeit: "5.00",
      });
      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(["discount", "forfeit"].sort());
    });
  });
});

// ============================================================
// DepositVerify ← NOVO
// ============================================================
describe("DepositVerify", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com balance positivo com decimais", async () => {
      const errors = await validateInput(DepositVerify, {
        balance: "100.00",
      });
      expect(errors).toHaveLength(0);
    });

    it("aceita balance positivo com muitas casas decimais", async () => {
      const errors = await validateInput(DepositVerify, {
        balance: "0.01",
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("balance", () => {
    it("rejeita balance negativo (allow_negatives: false)", async () => {
      const errors = await validateInput(DepositVerify, {
        balance: "-50.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita balance zero (isNotZero)", async () => {
      const errors = await validateInput(DepositVerify, {
        balance: "0.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("isNotZero");
    });

    it("rejeita formato de moeda inválido", async () => {
      const errors = await validateInput(DepositVerify, {
        balance: "nao-e-moeda",
      });
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita quando ausente", async () => {
      const errors = await validateInput(DepositVerify, {});
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(DepositVerify, {
        balance: null as unknown as string,
      });
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });
});

// ============================================================
// WithdrawVerify ← NOVO
// ============================================================
describe("WithdrawVerify", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com balance negativo com decimais", async () => {
      const errors = await validateInput(WithdrawVerify, {
        balance: "-100.00",
      });
      expect(errors).toHaveLength(0);
    });

    it("aceita balance negativo com muitas casas decimais", async () => {
      const errors = await validateInput(WithdrawVerify, {
        balance: "-0.01",
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("balance (deve ser negativo)", () => {
    it("rejeita balance positivo (matches exige hífen)", async () => {
      const errors = await validateInput(WithdrawVerify, {
        balance: "100.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("matches");
    });

    it("rejeita balance zero (matches + isNotZero)", async () => {
      const errors = await validateInput(WithdrawVerify, {
        balance: "0.00",
      });
      const constraints = constraintsFor(errors, "balance");
      expect(constraints).toContain("matches");
      expect(constraints).toContain("isNotZero");
    });

    it("rejeita formato de moeda inválido", async () => {
      const errors = await validateInput(WithdrawVerify, {
        balance: "nao-e-moeda",
      });
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita quando ausente", async () => {
      const errors = await validateInput(WithdrawVerify, {});
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita null", async () => {
      const errors = await validateInput(WithdrawVerify, {
        balance: null as unknown as string,
      });
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });
});

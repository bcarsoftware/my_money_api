import "reflect-metadata";

import { validate, ValidationError } from "class-validator";
import { AccountEnum } from "@/enums/AccountEnum";
import {
  CreateBankInput,
  ListBankInput,
  UpdateBankInput,
} from "@/resolvers/bank/BankInputs";

// Helper para validar instâncias
async function validateInput<T extends object>(
  Ctor: new () => T,
  plain: Partial<T>
): Promise<ValidationError[]> {
  const instance = Object.assign(new Ctor(), plain);
  return validate(instance);
}

// Helper para obter as constraints de um campo específico
function constraintsFor(errors: ValidationError[], property: string): string[] {
  const error = errors.find((e) => e.property === property);
  return error?.constraints ? Object.keys(error.constraints) : [];
}

// ============================================================
// CreateBankInput
// ============================================================
describe("CreateBankInput", () => {
  const validPayload = {
    code: "001",
    name: "Banco do Brasil",
    accountType: AccountEnum.CHECKING,
    accountNumber: "12345-6", // atenção: @IsNumberString não permite hífen
    agency: "0001",
    balance: "1500.75",
  };

  // Ajuste: accountNumber com hífen pode falhar no IsNumberString, então para teste válido usamos só números
  const validPayloadSemHifen = {
    code: "001",
    name: "Banco do Brasil",
    accountType: AccountEnum.CHECKING,
    accountNumber: "123456",
    agency: "0001",
    balance: "1500.75",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(CreateBankInput, validPayloadSemHifen);
      expect(errors).toHaveLength(0);
    });
  });

  describe("code", () => {
    it("aceita exatamente 8 caracteres (limite)", async () => {
      const errors = await validateInput(CreateBankInput, {
        ...validPayloadSemHifen,
        code: "12345678",
      });
      expect(constraintsFor(errors, "code")).toHaveLength(0);
    });

    it("rejeita 9 caracteres (acima do limite)", async () => {
      const errors = await validateInput(CreateBankInput, {
        ...validPayloadSemHifen,
        code: "123456789",
      });
      expect(constraintsFor(errors, "code")).toContain("maxLength");
    });

    it("rejeita caracteres não numéricos", async () => {
      const errors = await validateInput(CreateBankInput, {
        ...validPayloadSemHifen,
        code: "ABC",
      });
      expect(constraintsFor(errors, "code")).toContain("isNumberString");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { code, ...rest } = validPayloadSemHifen;
      const errors = await validateInput(CreateBankInput, rest);
      expect(constraintsFor(errors, "code")).toContain("isNumberString");
    });
  });

  describe("name", () => {
    it("aceita exatamente 64 caracteres (limite)", async () => {
      const errors = await validateInput(CreateBankInput, {
        ...validPayloadSemHifen,
        name: "a".repeat(64),
      });
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres (acima do limite)", async () => {
      const errors = await validateInput(CreateBankInput, {
        ...validPayloadSemHifen,
        name: "a".repeat(65),
      });
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { name, ...rest } = validPayloadSemHifen;
      const errors = await validateInput(CreateBankInput, rest);
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });
  });

  describe("accountType", () => {
    it("aceita todos os valores do enum AccountEnum", async () => {
      for (const tipo of Object.values(AccountEnum)) {
        const errors = await validateInput(CreateBankInput, {
          ...validPayloadSemHifen,
          accountType: tipo,
        });
        expect(errors).toHaveLength(0);
      }
    });

    it("rejeita valor inválido (não enum)", async () => {
      const errors = await validateInput(CreateBankInput, {
        ...validPayloadSemHifen,
        accountType: "INVALID" as unknown as AccountEnum,
      });
      expect(constraintsFor(errors, "accountType")).toContain("isEnum");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { accountType, ...rest } = validPayloadSemHifen;
      const errors = await validateInput(CreateBankInput, rest);
      expect(constraintsFor(errors, "accountType")).toContain("isEnum");
    });
  });

  describe("accountNumber", () => {
    it("aceita exatamente 64 caracteres (limite)", async () => {
      const errors = await validateInput(CreateBankInput, {
        ...validPayloadSemHifen,
        accountNumber: "1".repeat(64),
      });
      expect(constraintsFor(errors, "accountNumber")).toHaveLength(0);
    });

    it("rejeita 65 caracteres (acima do limite)", async () => {
      const errors = await validateInput(CreateBankInput, {
        ...validPayloadSemHifen,
        accountNumber: "1".repeat(65),
      });
      expect(constraintsFor(errors, "accountNumber")).toContain("maxLength");
    });

    it("rejeita caracteres não numéricos", async () => {
      const errors = await validateInput(CreateBankInput, {
        ...validPayloadSemHifen,
        accountNumber: "123A",
      });
      expect(constraintsFor(errors, "accountNumber")).toContain(
        "isNumberString"
      );
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { accountNumber, ...rest } = validPayloadSemHifen;
      const errors = await validateInput(CreateBankInput, rest);
      expect(constraintsFor(errors, "accountNumber")).toContain(
        "isNumberString"
      );
    });
  });

  describe("agency", () => {
    it("aceita exatamente 32 caracteres (limite)", async () => {
      const errors = await validateInput(CreateBankInput, {
        ...validPayloadSemHifen,
        agency: "1".repeat(32),
      });
      expect(constraintsFor(errors, "agency")).toHaveLength(0);
    });

    it("rejeita 33 caracteres (acima do limite)", async () => {
      const errors = await validateInput(CreateBankInput, {
        ...validPayloadSemHifen,
        agency: "1".repeat(33),
      });
      expect(constraintsFor(errors, "agency")).toContain("maxLength");
    });

    it("rejeita caracteres não numéricos", async () => {
      const errors = await validateInput(CreateBankInput, {
        ...validPayloadSemHifen,
        agency: "ABC",
      });
      expect(constraintsFor(errors, "agency")).toContain("isNumberString");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { agency, ...rest } = validPayloadSemHifen;
      const errors = await validateInput(CreateBankInput, rest);
      expect(constraintsFor(errors, "agency")).toContain("isNumberString");
    });
  });

  describe("balance", () => {
    it.each(["100.00", "0.00", "1,234.56", "-50.00", "100"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const errors = await validateInput(CreateBankInput, {
          ...validPayloadSemHifen,
          balance: value,
        });
        expect(constraintsFor(errors, "balance")).toHaveLength(0);
      }
    );

    it.each(["não é número", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const errors = await validateInput(CreateBankInput, {
          ...validPayloadSemHifen,
          balance: value,
        });
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { balance, ...rest } = validPayloadSemHifen;
      const errors = await validateInput(CreateBankInput, rest);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });
});

// ============================================================
// ListBankInput (na verdade é ListBankInput)
// ============================================================
describe("ListBankInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos os campos opcionais)", async () => {
      const errors = await validateInput(ListBankInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(ListBankInput, {
        limit: 10,
        offset: 0,
        code: "001",
        name: "Banco",
        accountType: AccountEnum.CHECKING,
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("limit", () => {
    it("aceita 0", async () => {
      const errors = await validateInput(ListBankInput, { limit: 0 });
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const errors = await validateInput(ListBankInput, { limit: 5 });
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const errors = await validateInput(ListBankInput, { limit: 10.5 });
      expect(constraintsFor(errors, "limit")).toContain("isInt");
    });

    it("rejeita valor negativo (tem @Min(0))", async () => {
      const errors = await validateInput(ListBankInput, { limit: -5 });
      expect(constraintsFor(errors, "limit")).toContain("min");
    });
  });

  describe("offset", () => {
    it("aceita 0", async () => {
      const errors = await validateInput(ListBankInput, { offset: 0 });
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("aceita valor positivo", async () => {
      const errors = await validateInput(ListBankInput, { offset: 2 });
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("rejeita valor não inteiro", async () => {
      const errors = await validateInput(ListBankInput, { offset: 1.5 });
      expect(constraintsFor(errors, "offset")).toContain("isInt");
    });

    it("rejeita valor negativo (tem @Min(0))", async () => {
      const errors = await validateInput(ListBankInput, { offset: -1 });
      expect(constraintsFor(errors, "offset")).toContain("min");
    });
  });

  describe("code", () => {
    it("aceita exatamente 8 caracteres", async () => {
      const errors = await validateInput(ListBankInput, { code: "12345678" });
      expect(constraintsFor(errors, "code")).toHaveLength(0);
    });

    it("rejeita 9 caracteres", async () => {
      const errors = await validateInput(ListBankInput, { code: "123456789" });
      expect(constraintsFor(errors, "code")).toContain("maxLength");
    });

    it("rejeita caracteres não numéricos", async () => {
      const errors = await validateInput(ListBankInput, { code: "ABC" });
      expect(constraintsFor(errors, "code")).toContain("isNumberString");
    });

    it("aceita undefined (opcional)", async () => {
      const errors = await validateInput(ListBankInput, { code: undefined });
      expect(constraintsFor(errors, "code")).toHaveLength(0);
    });
  });

  describe("name", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const errors = await validateInput(ListBankInput, {
        name: "a".repeat(64),
      });
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const errors = await validateInput(ListBankInput, {
        name: "a".repeat(65),
      });
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("aceita undefined (opcional)", async () => {
      const errors = await validateInput(ListBankInput, { name: undefined });
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });
  });

  describe("accountType", () => {
    it("aceita todos os valores do enum", async () => {
      for (const tipo of Object.values(AccountEnum)) {
        const errors = await validateInput(ListBankInput, {
          accountType: tipo,
        });
        expect(errors).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const errors = await validateInput(ListBankInput, {
        accountType: "INVALID" as unknown as AccountEnum,
      });
      expect(constraintsFor(errors, "accountType")).toContain("isEnum");
    });

    it("aceita undefined (opcional)", async () => {
      const errors = await validateInput(ListBankInput, {
        accountType: undefined,
      });
      expect(constraintsFor(errors, "accountType")).toHaveLength(0);
    });
  });
});

// ============================================================
// UpdateBankInput
// ============================================================
describe("UpdateBankInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto vazio (todos os campos opcionais)", async () => {
      const errors = await validateInput(UpdateBankInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos válidos", async () => {
      const errors = await validateInput(UpdateBankInput, {
        code: "001",
        name: "Novo Banco",
        accountType: AccountEnum.SAVING,
        accountNumber: "987654",
        agency: "0002",
        balance: "2500.00",
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("code (opcional)", () => {
    it("aceita exatamente 8 caracteres", async () => {
      const errors = await validateInput(UpdateBankInput, { code: "12345678" });
      expect(constraintsFor(errors, "code")).toHaveLength(0);
    });

    it("rejeita 9 caracteres", async () => {
      const errors = await validateInput(UpdateBankInput, {
        code: "123456789",
      });
      expect(constraintsFor(errors, "code")).toContain("maxLength");
    });

    it("rejeita caracteres não numéricos", async () => {
      const errors = await validateInput(UpdateBankInput, { code: "ABC" });
      expect(constraintsFor(errors, "code")).toContain("isNumberString");
    });

    it("aceita undefined (opcional)", async () => {
      const errors = await validateInput(UpdateBankInput, { code: undefined });
      expect(constraintsFor(errors, "code")).toHaveLength(0);
    });
  });

  describe("name (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const errors = await validateInput(UpdateBankInput, {
        name: "a".repeat(64),
      });
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const errors = await validateInput(UpdateBankInput, {
        name: "a".repeat(65),
      });
      expect(constraintsFor(errors, "name")).toContain("maxLength");
    });

    it("aceita undefined (opcional)", async () => {
      const errors = await validateInput(UpdateBankInput, { name: undefined });
      expect(constraintsFor(errors, "name")).toHaveLength(0);
    });
  });

  describe("accountType (opcional)", () => {
    it("aceita todos os valores do enum", async () => {
      for (const tipo of Object.values(AccountEnum)) {
        const errors = await validateInput(UpdateBankInput, {
          accountType: tipo,
        });
        expect(errors).toHaveLength(0);
      }
    });

    it("rejeita valor inválido", async () => {
      const errors = await validateInput(UpdateBankInput, {
        accountType: "INVALID" as unknown as AccountEnum,
      });
      expect(constraintsFor(errors, "accountType")).toContain("isEnum");
    });

    it("aceita undefined (opcional)", async () => {
      const errors = await validateInput(UpdateBankInput, {
        accountType: undefined,
      });
      expect(constraintsFor(errors, "accountType")).toHaveLength(0);
    });
  });

  describe("accountNumber (opcional)", () => {
    it("aceita exatamente 64 caracteres", async () => {
      const errors = await validateInput(UpdateBankInput, {
        accountNumber: "1".repeat(64),
      });
      expect(constraintsFor(errors, "accountNumber")).toHaveLength(0);
    });

    it("rejeita 65 caracteres", async () => {
      const errors = await validateInput(UpdateBankInput, {
        accountNumber: "1".repeat(65),
      });
      expect(constraintsFor(errors, "accountNumber")).toContain("maxLength");
    });

    it("rejeita caracteres não numéricos", async () => {
      const errors = await validateInput(UpdateBankInput, {
        accountNumber: "123A",
      });
      expect(constraintsFor(errors, "accountNumber")).toContain(
        "isNumberString"
      );
    });

    it("aceita undefined (opcional)", async () => {
      const errors = await validateInput(UpdateBankInput, {
        accountNumber: undefined,
      });
      expect(constraintsFor(errors, "accountNumber")).toHaveLength(0);
    });
  });

  describe("agency (opcional)", () => {
    it("aceita exatamente 32 caracteres", async () => {
      const errors = await validateInput(UpdateBankInput, {
        agency: "1".repeat(32),
      });
      expect(constraintsFor(errors, "agency")).toHaveLength(0);
    });

    it("rejeita 33 caracteres", async () => {
      const errors = await validateInput(UpdateBankInput, {
        agency: "1".repeat(33),
      });
      expect(constraintsFor(errors, "agency")).toContain("maxLength");
    });

    it("rejeita caracteres não numéricos", async () => {
      const errors = await validateInput(UpdateBankInput, { agency: "ABC" });
      expect(constraintsFor(errors, "agency")).toContain("isNumberString");
    });

    it("aceita undefined (opcional)", async () => {
      const errors = await validateInput(UpdateBankInput, {
        agency: undefined,
      });
      expect(constraintsFor(errors, "agency")).toHaveLength(0);
    });
  });

  describe("balance (opcional)", () => {
    it.each(["100.00", "0.00", "1,234.56", "-50.00"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const errors = await validateInput(UpdateBankInput, { balance: value });
        expect(constraintsFor(errors, "balance")).toHaveLength(0);
      }
    );

    it.each(["não é número", "", "100.5"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const errors = await validateInput(UpdateBankInput, { balance: value });
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("aceita undefined (opcional)", async () => {
      const errors = await validateInput(UpdateBankInput, {
        balance: undefined,
      });
      expect(constraintsFor(errors, "balance")).toHaveLength(0);
    });
  });
});

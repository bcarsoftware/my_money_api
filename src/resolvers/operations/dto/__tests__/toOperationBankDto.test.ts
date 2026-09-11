import { OperationBank } from "@/entities/OperationBank";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { OperationBankDto } from "@/resolvers/operations/dto/OperationBankDto";
import { toOperationBankDto } from "@/resolvers/operations/dto/toOperationBankDto";

// ============================================================
// Factory
// ============================================================
function makeOperationBank(
  overrides: Partial<OperationBank> = {}
): OperationBank {
  return {
    id: "op-bank-1",
    operationRegister: "reg-1",
    userId: "user-1",
    bankId: "bank-1",
    bankBoxId: "box-1",
    invoiceId: "invoice-1",
    tag: "Compra",
    description: "Descrição qualquer",
    balance: "100.00",
    discount: "10.00",
    forfeit: "5.00",
    amount: "95.00",
    typeOperation: OperationEnum.PIX,
    local: LocalEnum.INTERNAL,
    createdAt: new Date("2026-01-15T10:30:00.000Z"),
    updatedAt: new Date("2026-01-16T11:45:00.000Z"),
    user: null,
    bank: null,
    bankBox: null,
    invoice: null,
    ...overrides,
  } as unknown as OperationBank;
}

describe("toOperationBankDto", () => {
  // ============================================================
  // Caminho feliz
  // ============================================================
  describe("caminho feliz", () => {
    it("deve mapear todos os campos corretamente", () => {
      const operationBank = makeOperationBank();

      const result = toOperationBankDto(operationBank);

      expect(result).toEqual<OperationBankDto>({
        id: "op-bank-1",
        operationRegister: "reg-1",
        userId: "user-1",
        bankId: "bank-1",
        bankBoxId: "box-1",
        invoiceId: "invoice-1",
        tag: "Compra",
        description: "Descrição qualquer",
        balance: "100.00",
        discount: "10.00",
        forfeit: "5.00",
        amount: "95.00",
        typeOperation: OperationEnum.PIX,
        local: LocalEnum.INTERNAL,
        createdAt: "2026-01-15T10:30:00.000Z",
      });
    });

    it("deve manter os campos decimais como string", () => {
      const operationBank = makeOperationBank({
        balance: "1234.56",
        discount: "99.99",
        forfeit: "0.01",
        amount: "1134.56",
      });

      const result = toOperationBankDto(operationBank);

      expect(result.balance).toBe("1234.56");
      expect(result.discount).toBe("99.99");
      expect(result.forfeit).toBe("0.01");
      expect(result.amount).toBe("1134.56");
    });

    it("deve preservar os valores dos enums", () => {
      const operationBank = makeOperationBank({
        typeOperation: OperationEnum.TED,
        local: LocalEnum.EXTERNAL,
      });

      const result = toOperationBankDto(operationBank);

      expect(result.typeOperation).toBe(OperationEnum.TED);
      expect(result.local).toBe(LocalEnum.EXTERNAL);
    });
  });

  // ============================================================
  // Campos opcionais → null
  // ============================================================
  describe("campos opcionais definidos como null", () => {
    it("deve manter null em bankBoxId", () => {
      const result = toOperationBankDto(makeOperationBank({ bankBoxId: null }));

      expect(result.bankBoxId).toBeNull();
    });

    it("deve manter null em invoiceId", () => {
      const result = toOperationBankDto(makeOperationBank({ invoiceId: null }));

      expect(result.invoiceId).toBeNull();
    });

    it("deve manter null em description", () => {
      const result = toOperationBankDto(
        makeOperationBank({ description: null })
      );

      expect(result.description).toBeNull();
    });

    it("deve manter null em discount", () => {
      const result = toOperationBankDto(makeOperationBank({ discount: null }));

      expect(result.discount).toBeNull();
    });

    it("deve manter null em forfeit", () => {
      const result = toOperationBankDto(makeOperationBank({ forfeit: null }));

      expect(result.forfeit).toBeNull();
    });
  });

  describe("campos opcionais definidos como undefined", () => {
    it("deve converter undefined em null para bankBoxId", () => {
      const result = toOperationBankDto(
        makeOperationBank({ bankBoxId: undefined })
      );

      expect(result.bankBoxId).toBeNull();
    });

    it("deve converter undefined em null para invoiceId", () => {
      const result = toOperationBankDto(
        makeOperationBank({ invoiceId: undefined })
      );

      expect(result.invoiceId).toBeNull();
    });

    it("deve converter undefined em null para description", () => {
      const result = toOperationBankDto(
        makeOperationBank({ description: undefined })
      );

      expect(result.description).toBeNull();
    });

    it("deve converter undefined em null para discount", () => {
      const result = toOperationBankDto(
        makeOperationBank({ discount: undefined })
      );

      expect(result.discount).toBeNull();
    });

    it("deve converter undefined em null para forfeit", () => {
      const result = toOperationBankDto(
        makeOperationBank({ forfeit: undefined })
      );

      expect(result.forfeit).toBeNull();
    });
  });

  // ============================================================
  // createdAt → ISO string
  // ============================================================
  describe("createdAt", () => {
    it("deve converter Date para string ISO", () => {
      const date = new Date("2026-03-20T14:00:00.000Z");
      const result = toOperationBankDto(makeOperationBank({ createdAt: date }));

      expect(result.createdAt).toBe("2026-03-20T14:00:00.000Z");
      expect(typeof result.createdAt).toBe("string");
    });

    it("deve preservar o horário exato com milissegundos", () => {
      const date = new Date("2026-03-20T14:00:00.123Z");
      const result = toOperationBankDto(makeOperationBank({ createdAt: date }));

      expect(result.createdAt).toBe(date.toISOString());
    });
  });

  // ============================================================
  // Todos os valores de enum
  // ============================================================
  describe("typeOperation", () => {
    it.each(Object.values(OperationEnum))(
      "deve aceitar typeOperation = %s",
      (typeOperation) => {
        const result = toOperationBankDto(makeOperationBank({ typeOperation }));

        expect(result.typeOperation).toBe(typeOperation);
      }
    );
  });

  describe("local", () => {
    it.each(Object.values(LocalEnum))("deve aceitar local = %s", (local) => {
      const result = toOperationBankDto(makeOperationBank({ local }));

      expect(result.local).toBe(local);
    });
  });

  // ============================================================
  // Estrutura do DTO
  // ============================================================
  describe("estrutura do DTO", () => {
    it("não deve incluir campos que não pertencem ao DTO", () => {
      const result = toOperationBankDto(makeOperationBank());

      expect(result).not.toHaveProperty("updatedAt");
      expect(result).not.toHaveProperty("user");
      expect(result).not.toHaveProperty("bank");
      expect(result).not.toHaveProperty("bankBox");
      expect(result).not.toHaveProperty("invoice");
    });

    it("deve retornar exatamente 15 propriedades", () => {
      const result = toOperationBankDto(makeOperationBank());

      expect(Object.keys(result)).toHaveLength(15);
    });
  });
});

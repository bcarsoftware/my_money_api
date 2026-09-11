import { OperationMoney } from "@/entities/OperationMoney";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { OperationMoneyDto } from "@/resolvers/operations/dto/OperationMoneyDto";
import { toOperationMoneyDto } from "@/resolvers/operations/dto/toOperationMoneyDto";

// ============================================================
// Factory
// ============================================================
function makeOperationMoney(
  overrides: Partial<OperationMoney> = {}
): OperationMoney {
  return {
    id: "op-money-1",
    operationRegister: "reg-1",
    userId: "user-1",
    moneyId: "money-1",
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
    user: null as unknown as OperationMoney["user"],
    money: null as unknown as OperationMoney["money"],
    ...overrides,
  } as unknown as OperationMoney;
}

describe("toOperationMoneyDto", () => {
  // ============================================================
  // Caminho feliz
  // ============================================================
  describe("caminho feliz", () => {
    it("deve mapear todos os campos corretamente", () => {
      const operationMoney = makeOperationMoney();

      const result = toOperationMoneyDto(operationMoney);

      expect(result).toEqual<OperationMoneyDto>({
        id: "op-money-1",
        operationRegister: "reg-1",
        userId: "user-1",
        moneyId: "money-1",
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
      const operationMoney = makeOperationMoney({
        balance: "1234.56",
        discount: "99.99",
        forfeit: "0.01",
        amount: "1134.56",
      });

      const result = toOperationMoneyDto(operationMoney);

      expect(result.balance).toBe("1234.56");
      expect(result.discount).toBe("99.99");
      expect(result.forfeit).toBe("0.01");
      expect(result.amount).toBe("1134.56");
    });

    it("deve preservar os valores dos enums", () => {
      const operationMoney = makeOperationMoney({
        typeOperation: OperationEnum.TED,
        local: LocalEnum.EXTERNAL,
      });

      const result = toOperationMoneyDto(operationMoney);

      expect(result.typeOperation).toBe(OperationEnum.TED);
      expect(result.local).toBe(LocalEnum.EXTERNAL);
    });
  });

  // ============================================================
  // Campos opcionais → null
  // ============================================================
  describe("campos opcionais definidos como null", () => {
    it("deve manter null em description", () => {
      const result = toOperationMoneyDto(
        makeOperationMoney({ description: null })
      );

      expect(result.description).toBeNull();
    });

    it("deve manter null em discount", () => {
      const result = toOperationMoneyDto(
        makeOperationMoney({ discount: null })
      );

      expect(result.discount).toBeNull();
    });

    it("deve manter null em forfeit", () => {
      const result = toOperationMoneyDto(makeOperationMoney({ forfeit: null }));

      expect(result.forfeit).toBeNull();
    });
  });

  describe("campos opcionais definidos como undefined", () => {
    it("deve converter undefined em null para description", () => {
      const result = toOperationMoneyDto(
        makeOperationMoney({ description: undefined })
      );

      expect(result.description).toBeNull();
    });

    it("deve converter undefined em null para discount", () => {
      const result = toOperationMoneyDto(
        makeOperationMoney({ discount: undefined })
      );

      expect(result.discount).toBeNull();
    });

    it("deve converter undefined em null para forfeit", () => {
      const result = toOperationMoneyDto(
        makeOperationMoney({ forfeit: undefined })
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
      const result = toOperationMoneyDto(
        makeOperationMoney({ createdAt: date })
      );

      expect(result.createdAt).toBe("2026-03-20T14:00:00.000Z");
      expect(typeof result.createdAt).toBe("string");
    });

    it("deve preservar o horário exato com milissegundos", () => {
      const date = new Date("2026-03-20T14:00:00.123Z");
      const result = toOperationMoneyDto(
        makeOperationMoney({ createdAt: date })
      );

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
        const result = toOperationMoneyDto(
          makeOperationMoney({ typeOperation })
        );

        expect(result.typeOperation).toBe(typeOperation);
      }
    );
  });

  describe("local", () => {
    it.each(Object.values(LocalEnum))("deve aceitar local = %s", (local) => {
      const result = toOperationMoneyDto(makeOperationMoney({ local }));

      expect(result.local).toBe(local);
    });
  });

  // ============================================================
  // Estrutura do DTO
  // ============================================================
  describe("estrutura do DTO", () => {
    it("não deve incluir campos que não pertencem ao DTO", () => {
      const result = toOperationMoneyDto(makeOperationMoney());

      expect(result).not.toHaveProperty("updatedAt");
      expect(result).not.toHaveProperty("user");
      expect(result).not.toHaveProperty("money");
    });

    it("deve retornar exatamente 13 propriedades", () => {
      const result = toOperationMoneyDto(makeOperationMoney());

      expect(Object.keys(result)).toHaveLength(13);
    });
  });
});

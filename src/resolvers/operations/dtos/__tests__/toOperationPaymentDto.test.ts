import { OperationPayment } from "@/entities/OperationPayment";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { OperationPaymentDto } from "@/resolvers/operations/dtos/OperationPaymentDto";
import { toOperationPaymentDto } from "@/resolvers/operations/dtos/toOperationPaymentDto";

// ============================================================
// Factory
// ============================================================
function makeOperationPayment(
  overrides: Partial<OperationPayment> = {}
): OperationPayment {
  return {
    id: "op-payment-1",
    operationRegister: "reg-1",
    userId: "user-1",
    paymentId: "payment-1",
    tag: "Pagamento",
    description: "Descrição qualquer",
    balance: "100.00",
    discount: "10.00",
    forfeit: "5.00",
    amount: "95.00",
    typeOperation: OperationEnum.PAYMENT,
    local: LocalEnum.INTERNAL,
    createdAt: new Date("2026-01-15T10:30:00.000Z"),
    updatedAt: new Date("2026-01-16T11:45:00.000Z"),
    user: null,
    payment: null,
    ...overrides,
  } as unknown as OperationPayment;
}

describe("toOperationPaymentDto", () => {
  // ============================================================
  // Caminho feliz
  // ============================================================
  describe("caminho feliz", () => {
    it("deve mapear todos os campos corretamente", () => {
      const operationPayment = makeOperationPayment();

      const result = toOperationPaymentDto(operationPayment);

      expect(result).toEqual<OperationPaymentDto>({
        id: "op-payment-1",
        operationRegister: "reg-1",
        userId: "user-1",
        paymentId: "payment-1",
        tag: "Pagamento",
        description: "Descrição qualquer",
        balance: "100.00",
        discount: "10.00",
        forfeit: "5.00",
        amount: "95.00",
        typeOperation: OperationEnum.PAYMENT,
        local: LocalEnum.INTERNAL,
        createdAt: "2026-01-15T10:30:00.000Z",
      });
    });

    it("deve manter os campos decimais como string", () => {
      const operationPayment = makeOperationPayment({
        balance: "1234.56",
        discount: "99.99",
        forfeit: "0.01",
        amount: "1134.56",
      });

      const result = toOperationPaymentDto(operationPayment);

      expect(result.balance).toBe("1234.56");
      expect(result.discount).toBe("99.99");
      expect(result.forfeit).toBe("0.01");
      expect(result.amount).toBe("1134.56");
    });

    it("deve preservar os valores dos enums", () => {
      const operationPayment = makeOperationPayment({
        typeOperation: OperationEnum.TED,
        local: LocalEnum.EXTERNAL,
      });

      const result = toOperationPaymentDto(operationPayment);

      expect(result.typeOperation).toBe(OperationEnum.TED);
      expect(result.local).toBe(LocalEnum.EXTERNAL);
    });
  });

  // ============================================================
  // Campos opcionais → null
  // ============================================================
  describe("campos opcionais definidos como null", () => {
    it("deve manter null em description", () => {
      const result = toOperationPaymentDto(
        makeOperationPayment({ description: null })
      );

      expect(result.description).toBeNull();
    });

    it("deve manter null em discount", () => {
      const result = toOperationPaymentDto(
        makeOperationPayment({ discount: null })
      );

      expect(result.discount).toBeNull();
    });

    it("deve manter null em forfeit", () => {
      const result = toOperationPaymentDto(
        makeOperationPayment({ forfeit: null })
      );

      expect(result.forfeit).toBeNull();
    });
  });

  describe("campos opcionais definidos como undefined", () => {
    it("deve converter undefined em null para description", () => {
      const result = toOperationPaymentDto(
        makeOperationPayment({ description: undefined })
      );

      expect(result.description).toBeNull();
    });

    it("deve converter undefined em null para discount", () => {
      const result = toOperationPaymentDto(
        makeOperationPayment({ discount: undefined })
      );

      expect(result.discount).toBeNull();
    });

    it("deve converter undefined em null para forfeit", () => {
      const result = toOperationPaymentDto(
        makeOperationPayment({ forfeit: undefined })
      );

      expect(result.forfeit).toBeNull();
    });
  });

  // ============================================================
  // Combinações de campos opcionais
  // ============================================================
  describe("combinações de campos opcionais", () => {
    it("deve mapear corretamente quando todos os campos opcionais estão null", () => {
      const result = toOperationPaymentDto(
        makeOperationPayment({
          description: null,
          discount: null,
          forfeit: null,
        })
      );

      expect(result.description).toBeNull();
      expect(result.discount).toBeNull();
      expect(result.forfeit).toBeNull();
    });

    it("deve mapear corretamente quando todos os campos opcionais estão undefined", () => {
      const result = toOperationPaymentDto(
        makeOperationPayment({
          description: undefined,
          discount: undefined,
          forfeit: undefined,
        })
      );

      expect(result.description).toBeNull();
      expect(result.discount).toBeNull();
      expect(result.forfeit).toBeNull();
    });
  });

  // ============================================================
  // createdAt → ISO string
  // ============================================================
  describe("createdAt", () => {
    it("deve converter Date para string ISO", () => {
      const date = new Date("2026-03-20T14:00:00.000Z");
      const result = toOperationPaymentDto(
        makeOperationPayment({ createdAt: date })
      );

      expect(result.createdAt).toBe("2026-03-20T14:00:00.000Z");
      expect(typeof result.createdAt).toBe("string");
    });

    it("deve preservar o horário exato com milissegundos", () => {
      const date = new Date("2026-03-20T14:00:00.123Z");
      const result = toOperationPaymentDto(
        makeOperationPayment({ createdAt: date })
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
        const result = toOperationPaymentDto(
          makeOperationPayment({ typeOperation })
        );

        expect(result.typeOperation).toBe(typeOperation);
      }
    );
  });

  describe("local", () => {
    it.each(Object.values(LocalEnum))("deve aceitar local = %s", (local) => {
      const result = toOperationPaymentDto(makeOperationPayment({ local }));

      expect(result.local).toBe(local);
    });
  });

  // ============================================================
  // Estrutura do DTO
  // ============================================================
  describe("estrutura do DTO", () => {
    it("não deve incluir campos que não pertencem ao DTO", () => {
      const result = toOperationPaymentDto(makeOperationPayment());

      expect(result).not.toHaveProperty("updatedAt");
      expect(result).not.toHaveProperty("user");
      expect(result).not.toHaveProperty("bank");
      expect(result).not.toHaveProperty("money");
      expect(result).not.toHaveProperty("invoice");
    });

    it("deve retornar exatamente 15 propriedades", () => {
      const result = toOperationPaymentDto(makeOperationPayment());

      expect(Object.keys(result)).toHaveLength(13);
    });
  });
});

import { Payment } from "@/entities/Payment";
import { MonthEnum } from "@/enums/MonthEnum";
import { PaymentEnum } from "@/enums/PaymentEnum";
import { RepeatEnum } from "@/enums/RepeatEnum";
import { toPaymentDto } from "@/resolvers/payment/dto/toPaymentDto";

// ============================================================
// Helper
// ============================================================
function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "payment-123",
    userId: "user-456",
    name: "Aluguel",
    description: "Pagamento do aluguel mensal",
    repeat: RepeatEnum.NO_REPEAT,
    balance: "1500.00",
    day: 5,
    month: MonthEnum.JANUARY,
    status: PaymentEnum.ACTIVE,
    createdAt: new Date("2025-01-01T10:00:00.000Z"),
    updatedAt: new Date("2025-01-02T12:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  } as Payment;
}

// ============================================================
// Testes
// ============================================================
describe("toPaymentDto", () => {
  it("deve mapear todos os campos corretamente", () => {
    const mockPayment = makePayment();
    const dto = toPaymentDto(mockPayment);

    expect(dto).toEqual({
      id: mockPayment.id,
      userId: mockPayment.userId,
      name: mockPayment.name,
      description: mockPayment.description,
      repeat: mockPayment.repeat,
      balance: mockPayment.balance,
      day: mockPayment.day,
      month: mockPayment.month,
      status: mockPayment.status,
      createdAt: mockPayment.createdAt.toISOString(),
    });
  });

  it("deve retornar os valores exatos, sem transformações (exceto createdAt)", () => {
    const mockPayment = makePayment();
    const dto = toPaymentDto(mockPayment);

    expect(dto.id).toBe(mockPayment.id);
    expect(dto.userId).toBe(mockPayment.userId);
    expect(dto.name).toBe(mockPayment.name);
    expect(dto.description).toBe(mockPayment.description);
    expect(dto.repeat).toBe(mockPayment.repeat);
    expect(dto.balance).toBe(mockPayment.balance);
    expect(dto.day).toBe(mockPayment.day);
    expect(dto.month).toBe(mockPayment.month);
    expect(dto.status).toBe(mockPayment.status);
    expect(dto.createdAt).toBe(mockPayment.createdAt.toISOString());
  });

  it("deve converter createdAt de Date para string ISO", () => {
    const mockDate = new Date("2025-01-01T10:30:00.000Z");
    const mockPayment = makePayment({ createdAt: mockDate });
    const dto = toPaymentDto(mockPayment);

    expect(dto.createdAt).toBe("2025-01-01T10:30:00.000Z");
    expect(typeof dto.createdAt).toBe("string");
  });

  it("deve lidar com description null", () => {
    const mockPayment = makePayment({ description: null });
    const dto = toPaymentDto(mockPayment);
    expect(dto.description).toBeNull();
  });

  it("deve lidar com description undefined", () => {
    const mockPayment = makePayment({ description: undefined });
    const dto = toPaymentDto(mockPayment);
    expect(dto.description).toBeNull(); // fallback para null
  });

  it("deve ignorar campos extras da entidade (updatedAt, deletedAt)", () => {
    const mockPayment = makePayment();
    const dto = toPaymentDto(mockPayment);

    expect(dto).not.toHaveProperty("updatedAt");
    expect(dto).not.toHaveProperty("deletedAt");
  });

  it("deve funcionar com todos os valores do enum RepeatEnum", () => {
    const valores = Object.values(RepeatEnum);
    for (const repeat of valores) {
      const mockPayment = makePayment({ repeat });
      const dto = toPaymentDto(mockPayment);
      expect(dto.repeat).toBe(repeat);
    }
  });

  it("deve funcionar com todos os valores do enum MonthEnum", () => {
    const valores = Object.values(MonthEnum);
    for (const month of valores) {
      const mockPayment = makePayment({ month });
      const dto = toPaymentDto(mockPayment);
      expect(dto.month).toBe(month);
    }
  });

  it("deve funcionar com todos os valores do enum PaymentEnum", () => {
    const valores = Object.values(PaymentEnum);
    for (const status of valores) {
      const mockPayment = makePayment({ status });
      const dto = toPaymentDto(mockPayment);
      expect(dto.status).toBe(status);
    }
  });

  it("deve falhar com status inválido (não enum)", () => {
    const mockPayment = makePayment({
      status: "INVALIDO" as unknown as PaymentEnum,
    });
    const dto = toPaymentDto(mockPayment);
    expect(dto.status).toBe("INVALIDO");
  });

  it("deve funcionar com day como número", () => {
    const mockPayment = makePayment({ day: 15 });
    const dto = toPaymentDto(mockPayment);
    expect(dto.day).toBe(15);
    expect(typeof dto.day).toBe("number");
  });

  it("deve funcionar com balance como string", () => {
    const mockPayment = makePayment({ balance: "2500.50" });
    const dto = toPaymentDto(mockPayment);
    expect(dto.balance).toBe("2500.50");
    expect(typeof dto.balance).toBe("string");
  });

  it("deve funcionar com name de 64 caracteres (limite máximo)", () => {
    const longName = "a".repeat(64);
    const mockPayment = makePayment({ name: longName });
    const dto = toPaymentDto(mockPayment);
    expect(dto.name).toBe(longName);
  });

  it("deve funcionar com description de 256 caracteres (limite máximo)", () => {
    const longDescription = "a".repeat(256);
    const mockPayment = makePayment({ description: longDescription });
    const dto = toPaymentDto(mockPayment);
    expect(dto.description).toBe(longDescription);
  });

  it("deve preservar o formato da data (string ISO)", () => {
    const mockPayment = makePayment();
    const dto = toPaymentDto(mockPayment);

    // Verifica se é uma string ISO válida
    expect(dto.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  it("deve funcionar com datas no passado", () => {
    const pastDate = new Date("2020-01-01T00:00:00.000Z");
    const mockPayment = makePayment({ createdAt: pastDate });
    const dto = toPaymentDto(mockPayment);

    expect(dto.createdAt).toBe("2020-01-01T00:00:00.000Z");
  });

  it("deve funcionar com datas no futuro", () => {
    const futureDate = new Date("2030-12-31T23:59:59.999Z");
    const mockPayment = makePayment({ createdAt: futureDate });
    const dto = toPaymentDto(mockPayment);

    expect(dto.createdAt).toBe("2030-12-31T23:59:59.999Z");
  });
});

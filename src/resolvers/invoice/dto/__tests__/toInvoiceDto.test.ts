import { Invoice } from "@/entities/Invoice";
import { InvoiceStatusEnum } from "@/enums/InvoiceStatusEnum";
import { RepeatEnum } from "@/enums/RepeatEnum";
import { toInvoiceDto } from "@/resolvers/invoice/dto/toInvoiceDto";

// ============================================================
// Helpers
// ============================================================
function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "invoice-123",
    bankId: "bank-456",
    name: "Fatura de Luz",
    description: "Conta de luz - vencimento 10/08",
    repeat: RepeatEnum.NO_REPEAT,
    installments: 1,
    paidInstallments: 0,
    balance: "150.00",
    total: "150.00",
    status: InvoiceStatusEnum.ACTIVE,
    createdAt: new Date("2026-09-04T10:30:00.000Z"),
    updatedAt: new Date("2026-09-04T10:30:00.000Z"),
    deletedAt: null,
    bank: null as any,
    ...overrides,
  } as Invoice;
}

// ============================================================
// Testes
// ============================================================
describe("toInvoiceDto", () => {
  it("deve mapear todos os campos corretamente", () => {
    const mockInvoice = makeInvoice();
    const dto = toInvoiceDto(mockInvoice);

    expect(dto).toEqual({
      id: mockInvoice.id,
      name: mockInvoice.name,
      description: mockInvoice.description,
      repeat: mockInvoice.repeat,
      installments: mockInvoice.installments,
      paidInstallments: mockInvoice.paidInstallments,
      balance: mockInvoice.balance,
      total: mockInvoice.total,
      status: mockInvoice.status,
      createdAt: mockInvoice.createdAt.toISOString(),
    });
  });

  it("deve retornar os valores exatos, sem transformações (exceto createdAt)", () => {
    const mockInvoice = makeInvoice();
    const dto = toInvoiceDto(mockInvoice);

    expect(dto.id).toBe(mockInvoice.id);
    expect(dto.name).toBe(mockInvoice.name);
    expect(dto.description).toBe(mockInvoice.description);
    expect(dto.repeat).toBe(mockInvoice.repeat);
    expect(dto.installments).toBe(mockInvoice.installments);
    expect(dto.paidInstallments).toBe(mockInvoice.paidInstallments);
    expect(dto.balance).toBe(mockInvoice.balance);
    expect(dto.total).toBe(mockInvoice.total);
    expect(dto.status).toBe(mockInvoice.status);
    expect(dto.createdAt).toBe(mockInvoice.createdAt.toISOString());
  });

  it("deve converter createdAt de Date para string ISO", () => {
    const mockDate = new Date("2026-09-04T10:30:00.000Z");
    const mockInvoice = makeInvoice({ createdAt: mockDate });
    const dto = toInvoiceDto(mockInvoice);

    expect(dto.createdAt).toBe("2026-09-04T10:30:00.000Z");
    expect(typeof dto.createdAt).toBe("string");
  });

  it("deve ignorar campos extras da entidade (bankId, bank, updatedAt, deletedAt)", () => {
    const mockInvoice = makeInvoice();
    const dto = toInvoiceDto(mockInvoice);

    expect(dto).not.toHaveProperty("bankId");
    expect(dto).not.toHaveProperty("bank");
    expect(dto).not.toHaveProperty("updatedAt");
    expect(dto).not.toHaveProperty("deletedAt");
  });

  it("deve lidar com description null", () => {
    const mockInvoice = makeInvoice({ description: null });
    const dto = toInvoiceDto(mockInvoice);
    expect(dto.description).toBeNull();
  });

  it("deve lidar com description undefined", () => {
    const mockInvoice = makeInvoice({ description: undefined });
    const dto = toInvoiceDto(mockInvoice);
    expect(dto.description).toBeUndefined();
  });

  it("deve funcionar com todos os valores do enum RepeatEnum", () => {
    const valores = Object.values(RepeatEnum);
    for (const repeat of valores) {
      const mockInvoice = makeInvoice({ repeat });
      const dto = toInvoiceDto(mockInvoice);
      expect(dto.repeat).toBe(repeat);
    }
  });

  it("deve funcionar com todos os valores do enum InvoiceStatusEnum", () => {
    const valores = Object.values(InvoiceStatusEnum);
    for (const status of valores) {
      const mockInvoice = makeInvoice({ status });
      const dto = toInvoiceDto(mockInvoice);
      expect(dto.status).toBe(status);
    }
  });

  it("deve funcionar com installments e paidInstallments como números", () => {
    const mockInvoice = makeInvoice({ installments: 12, paidInstallments: 5 });
    const dto = toInvoiceDto(mockInvoice);

    expect(dto.installments).toBe(12);
    expect(dto.paidInstallments).toBe(5);
    expect(typeof dto.installments).toBe("number");
    expect(typeof dto.paidInstallments).toBe("number");
  });

  it("deve funcionar com balance e total como strings", () => {
    const mockInvoice = makeInvoice({ balance: "150.75", total: "150.75" });
    const dto = toInvoiceDto(mockInvoice);

    expect(dto.balance).toBe("150.75");
    expect(dto.total).toBe("150.75");
    expect(typeof dto.balance).toBe("string");
    expect(typeof dto.total).toBe("string");
  });

  it("deve funcionar com name de 64 caracteres (limite máximo)", () => {
    const longName = "a".repeat(64);
    const mockInvoice = makeInvoice({ name: longName });
    const dto = toInvoiceDto(mockInvoice);

    expect(dto.name).toBe(longName);
  });

  it("deve funcionar com description de 256 caracteres (limite máximo)", () => {
    const longDescription = "a".repeat(256);
    const mockInvoice = makeInvoice({ description: longDescription });
    const dto = toInvoiceDto(mockInvoice);

    expect(dto.description).toBe(longDescription);
  });

  it("deve preservar o formato da data (string ISO)", () => {
    const mockInvoice = makeInvoice();
    const dto = toInvoiceDto(mockInvoice);

    // Verifica se é uma string ISO válida
    expect(dto.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  it("deve funcionar com datas no passado", () => {
    const pastDate = new Date("2020-01-01T00:00:00.000Z");
    const mockInvoice = makeInvoice({ createdAt: pastDate });
    const dto = toInvoiceDto(mockInvoice);

    expect(dto.createdAt).toBe("2020-01-01T00:00:00.000Z");
  });

  it("deve funcionar com datas no futuro", () => {
    const futureDate = new Date("2030-12-31T23:59:59.999Z");
    const mockInvoice = makeInvoice({ createdAt: futureDate });
    const dto = toInvoiceDto(mockInvoice);

    expect(dto.createdAt).toBe("2030-12-31T23:59:59.999Z");
  });
});

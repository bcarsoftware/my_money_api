import { CurrencyEnum } from "@/enums/CurrencyEnum";
import { GenericBank } from "@/entities/GenericBank";
import { GenericBankInfo } from "@/entities/GenericBankInfo";
import { toGenericBankDto } from "@/resolvers/genereic-bank/dto/toGenericBankDto";

// ============================================================
// Helpers
// ============================================================
function makeGenericBankInfo(
  overrides: Partial<GenericBankInfo> = {}
): GenericBankInfo {
  return {
    id: "info-1",
    genericBankId: "generic-bank-1",
    name: "Info Name",
    value: "Info Value",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    genericBank: null as unknown as GenericBank,
    ...overrides,
  } as GenericBankInfo;
}

function makeGenericBank(overrides: Partial<GenericBank> = {}): GenericBank {
  return {
    id: "generic-bank-1",
    userId: "user-123",
    bankId: "bank-456",
    name: "Generic Bank",
    currency: CurrencyEnum.BRL,
    balance: "1000.00",
    bankInfo: [],
    createdAt: new Date("2025-01-01T10:00:00.000Z"),
    updatedAt: new Date("2025-01-02T12:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  } as GenericBank;
}

// ============================================================
// Testes
// ============================================================
describe("toGenericBankDto", () => {
  it("deve mapear todos os campos corretamente quando bankInfo está vazio", () => {
    const mockGenericBank = makeGenericBank();
    const dto = toGenericBankDto(mockGenericBank);

    expect(dto).toEqual({
      id: mockGenericBank.id,
      userId: mockGenericBank.userId,
      bankId: mockGenericBank.bankId,
      name: mockGenericBank.name,
      currency: mockGenericBank.currency,
      balance: mockGenericBank.balance,
      bankInfo: [],
      createdAt: mockGenericBank.createdAt.toISOString(),
    });
  });

  it("deve retornar os valores exatos, sem transformações (exceto createdAt)", () => {
    const mockGenericBank = makeGenericBank();
    const dto = toGenericBankDto(mockGenericBank);

    expect(dto.id).toBe(mockGenericBank.id);
    expect(dto.userId).toBe(mockGenericBank.userId);
    expect(dto.bankId).toBe(mockGenericBank.bankId);
    expect(dto.name).toBe(mockGenericBank.name);
    expect(dto.currency).toBe(mockGenericBank.currency);
    expect(dto.balance).toBe(mockGenericBank.balance);
    expect(dto.createdAt).toBe(mockGenericBank.createdAt.toISOString());
  });

  it("deve converter createdAt de Date para string ISO", () => {
    const mockDate = new Date("2025-06-15T14:30:00.000Z");
    const mockGenericBank = makeGenericBank({ createdAt: mockDate });
    const dto = toGenericBankDto(mockGenericBank);

    expect(dto.createdAt).toBe("2025-06-15T14:30:00.000Z");
    expect(typeof dto.createdAt).toBe("string");
  });

  it("deve mapear bankInfo quando houver itens", () => {
    const info1 = makeGenericBankInfo({
      id: "info-1",
      name: "Chave 1",
      value: "Valor 1",
    });
    const info2 = makeGenericBankInfo({
      id: "info-2",
      name: "Chave 2",
      value: "Valor 2",
    });
    const mockGenericBank = makeGenericBank({ bankInfo: [info1, info2] });

    const dto = toGenericBankDto(mockGenericBank);

    expect(dto.bankInfo).toEqual([
      { id: "info-1", name: "Chave 1", value: "Valor 1" },
      { id: "info-2", name: "Chave 2", value: "Valor 2" },
    ]);
  });

  it("deve retornar array vazia quando bankInfo estiver vazio", () => {
    const mockGenericBank = makeGenericBank({ bankInfo: [] });
    const dto = toGenericBankDto(mockGenericBank);

    expect(dto.bankInfo).toEqual([]);
    expect(dto.bankInfo).not.toBeNull();
  });

  it("deve retornar null quando bankInfo for undefined (relação não carregada)", () => {
    const mockGenericBank = makeGenericBank({ bankInfo: undefined });
    const dto = toGenericBankDto(mockGenericBank);

    expect(dto.bankInfo).toBeNull();
  });

  it("deve retornar null quando bankInfo for null (caso raro)", () => {
    const mockGenericBank = makeGenericBank({
      bankInfo: null as unknown as GenericBankInfo[],
    });
    const dto = toGenericBankDto(mockGenericBank);

    expect(dto.bankInfo).toBeNull();
  });

  it("deve ignorar campos extras da entidade (updatedAt, deletedAt, user, bank)", () => {
    const mockGenericBank = makeGenericBank();
    const dto = toGenericBankDto(mockGenericBank);

    expect(dto).not.toHaveProperty("updatedAt");
    expect(dto).not.toHaveProperty("deletedAt");
    expect(dto).not.toHaveProperty("user");
    expect(dto).not.toHaveProperty("bank");
  });

  it("deve funcionar com todos os valores do enum CurrencyEnum", () => {
    const valores = Object.values(CurrencyEnum);
    for (const currency of valores) {
      const mockGenericBank = makeGenericBank({ currency });
      const dto = toGenericBankDto(mockGenericBank);
      expect(dto.currency).toBe(currency);
    }
  });

  it("deve funcionar com name de 64 caracteres (limite máximo)", () => {
    const longName = "a".repeat(64);
    const mockGenericBank = makeGenericBank({ name: longName });
    const dto = toGenericBankDto(mockGenericBank);
    expect(dto.name).toBe(longName);
  });

  it("deve funcionar com balance como string", () => {
    const mockGenericBank = makeGenericBank({ balance: "2500.50" });
    const dto = toGenericBankDto(mockGenericBank);
    expect(dto.balance).toBe("2500.50");
    expect(typeof dto.balance).toBe("string");
  });

  it("deve preservar o formato da data (string ISO)", () => {
    const mockGenericBank = makeGenericBank();
    const dto = toGenericBankDto(mockGenericBank);

    expect(dto.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  it("deve funcionar com datas no passado", () => {
    const pastDate = new Date("2020-01-01T00:00:00.000Z");
    const mockGenericBank = makeGenericBank({ createdAt: pastDate });
    const dto = toGenericBankDto(mockGenericBank);

    expect(dto.createdAt).toBe("2020-01-01T00:00:00.000Z");
  });

  it("deve funcionar com bankInfo contendo vários itens e campos nulos", () => {
    const info1 = makeGenericBankInfo({
      name: null as unknown as string,
      value: "Valor 1",
    });
    const info2 = makeGenericBankInfo({
      name: "Chave 2",
      value: null as unknown as string,
    });
    const mockGenericBank = makeGenericBank({ bankInfo: [info1, info2] });

    const dto = toGenericBankDto(mockGenericBank);

    expect(dto.bankInfo).toEqual([
      { id: info1.id, name: null, value: "Valor 1" },
      { id: info2.id, name: "Chave 2", value: null },
    ]);
  });
});

import { Bank } from "@/entities/Bank";
import { AccountEnum } from "@/enums/AccountEnum";
import { toBankDto } from "@/resolvers/bank/dto/toBankDto";

function makeBank(overrides: Partial<Bank> = {}): Bank {
  return {
    id: "123e4567-e89b-12d3-a456-426614174000",
    userId: "user-123",
    code: "001",
    name: "Banco do Brasil",
    accountType: AccountEnum.CHECKING,
    accountNumber: "12345-6",
    agency: "0001",
    balance: 1500.75,
    createdAt: new Date("2025-01-01T10:00:00Z"),
    updatedAt: new Date("2025-01-02T12:00:00Z"),
    ...overrides,
  } as Bank;
}

describe("toBankDto", () => {
  it("deve mapear todos os campos corretamente", () => {
    const mockBank = makeBank();
    const dto = toBankDto(mockBank);

    expect(dto).toEqual({
      id: mockBank.id,
      userId: mockBank.userId,
      code: mockBank.code,
      name: mockBank.name,
      accountType: mockBank.accountType,
      accountNumber: mockBank.accountNumber,
      agency: mockBank.agency,
      balance: mockBank.balance,
      createdAt: mockBank.createdAt,
    });
  });

  it("deve retornar os valores exatos, sem transformações", () => {
    const mockBank = makeBank();
    const dto = toBankDto(mockBank);

    expect(dto.id).toBe(mockBank.id);
    expect(dto.userId).toBe(mockBank.userId);
    expect(dto.code).toBe(mockBank.code);
    expect(dto.name).toBe(mockBank.name);
    expect(dto.accountType).toBe(mockBank.accountType);
    expect(dto.accountNumber).toBe(mockBank.accountNumber);
    expect(dto.agency).toBe(mockBank.agency);
    expect(dto.balance).toBe(mockBank.balance);
    expect(dto.createdAt).toBe(mockBank.createdAt);
  });

  it("deve ignorar campos extras da entidade (updatedAt, deletedAt, user)", () => {
    const mockBank = makeBank();
    const dto = toBankDto(mockBank);

    expect(dto).not.toHaveProperty("updatedAt");
    expect(dto).not.toHaveProperty("deletedAt");
    expect(dto).not.toHaveProperty("user");
  });

  it("deve funcionar com valores mínimos (ex.: balance zero)", () => {
    const mockBank = makeBank();
    const bankWithZeroBalance = {
      ...mockBank,
      balance: "0",
    } as Bank;

    const dto = toBankDto(bankWithZeroBalance);
    expect(dto.balance).toBe("0");
  });

  it("deve funcionar com datas no passado", () => {
    const pastDate = new Date("2020-01-01T00:00:00Z");
    const mockBank = makeBank();
    const bankWithPastDate = {
      ...mockBank,
      createdAt: pastDate,
    } as Bank;

    const dto = toBankDto(bankWithPastDate);
    expect(dto.createdAt).toBe(pastDate);
  });

  it("deve preservar o tipo numérico do balance", () => {
    const mockBank = makeBank();
    const dto = toBankDto(mockBank);
    expect(typeof dto.balance).toBe("number");
  });
});

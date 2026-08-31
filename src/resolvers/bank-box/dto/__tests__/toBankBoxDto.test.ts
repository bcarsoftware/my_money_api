import { BankBox } from "@/entities/BankBox";
import { toBankBoxDto } from "@/resolvers/bank-box/dto/toBankBoxDto";

// ============================================================
// Factory para criar objetos BankBox
// ============================================================
function makeBankBox(overrides: Partial<BankBox> = {}): BankBox {
  return {
    id: "bankbox-123",
    bankId: "bank-456",
    tag: "Minha Caixa",
    objective: "1000.00",
    description: "Descrição da caixa",
    balance: "5000.00",
    createdAt: new Date("2025-02-01T10:00:00Z"),
    updatedAt: new Date("2025-02-02T12:00:00Z"),
    deletedAt: null,
    bank: null as unknown as BankBox, // não usado no DTO
    ...overrides
  } as BankBox;
}

// ============================================================
// Testes
// ============================================================
describe("toBankBoxDto", () => {
  it("deve mapear todos os campos corretamente", () => {
    const mockBankBox = makeBankBox();
    const dto = toBankBoxDto(mockBankBox);

    expect(dto).toEqual({
      id: mockBankBox.id,
      bankId: mockBankBox.bankId,
      tag: mockBankBox.tag,
      objective: mockBankBox.objective,
      description: mockBankBox.description,
      balance: mockBankBox.balance,
      createdAt: mockBankBox.createdAt,
    });
  });

  it("deve retornar os valores exatos, sem transformações", () => {
    const mockBankBox = makeBankBox();
    const dto = toBankBoxDto(mockBankBox);

    expect(dto.id).toBe(mockBankBox.id);
    expect(dto.bankId).toBe(mockBankBox.bankId);
    expect(dto.tag).toBe(mockBankBox.tag);
    expect(dto.objective).toBe(mockBankBox.objective);
    expect(dto.description).toBe(mockBankBox.description);
    expect(dto.balance).toBe(mockBankBox.balance);
    expect(dto.createdAt).toBe(mockBankBox.createdAt);
  });

  it("deve ignorar campos extras da entidade (updatedAt, deletedAt, bank)", () => {
    const mockBankBox = makeBankBox();
    const dto = toBankBoxDto(mockBankBox);

    expect(dto).not.toHaveProperty("updatedAt");
    expect(dto).not.toHaveProperty("deletedAt");
    expect(dto).not.toHaveProperty("bank");
  });

  it("deve lidar com objective null", () => {
    const mockBankBox = makeBankBox({ objective: null });
    const dto = toBankBoxDto(mockBankBox);
    expect(dto.objective).toBeNull();
  });

  it("deve lidar com objective undefined", () => {
    const mockBankBox = makeBankBox({ objective: undefined });
    const dto = toBankBoxDto(mockBankBox);
    expect(dto.objective).toBeUndefined();
  });

  it("deve lidar com description null", () => {
    const mockBankBox = makeBankBox({ description: null });
    const dto = toBankBoxDto(mockBankBox);
    expect(dto.description).toBeNull();
  });

  it("deve lidar com description undefined", () => {
    const mockBankBox = makeBankBox({ description: undefined });
    const dto = toBankBoxDto(mockBankBox);
    expect(dto.description).toBeUndefined();
  });

  it("deve funcionar com tag vazia", () => {
    const mockBankBox = makeBankBox({ tag: "" });
    const dto = toBankBoxDto(mockBankBox);
    expect(dto.tag).toBe("");
  });

  it("deve funcionar com balance contendo vírgula como separador decimal", () => {
    const mockBankBox = makeBankBox({ balance: "1.234,56" });
    const dto = toBankBoxDto(mockBankBox);
    expect(dto.balance).toBe("1.234,56");
  });

  it("deve preservar o tipo da balance (string)", () => {
    const mockBankBox = makeBankBox();
    const dto = toBankBoxDto(mockBankBox);
    expect(typeof dto.balance).toBe("string");
  });

  it("deve funcionar com datas no passado", () => {
    const pastDate = new Date("2020-01-01T00:00:00Z");
    const mockBankBox = makeBankBox({ createdAt: pastDate });
    const dto = toBankBoxDto(mockBankBox);
    expect(dto.createdAt).toBe(pastDate);
  });
});

import { GenericBank } from "@/entities/GenericBank";
import { GenericBankBox } from "@/entities/GenericBankBox";
import { toGenericBankBoxDto } from "@/resolvers/generic-bank-box/dto/toGenericBankBoxDto";

// ============================================================
// Helper
// ============================================================
function makeGenericBankBox(
  overrides: Partial<GenericBankBox> = {}
): GenericBankBox {
  return {
    id: "box-123",
    genericBankId: "generic-bank-456",
    name: "Caixa Principal",
    objective: "1000.00",
    description: "Descrição da caixa",
    balance: "5000.00",
    createdAt: new Date("2025-02-01T10:00:00.000Z"),
    updatedAt: new Date("2025-02-02T12:00:00.000Z"),
    deletedAt: null,
    genericBank: null as unknown as GenericBank,
    ...overrides,
  } as GenericBankBox;
}

// ============================================================
// Testes
// ============================================================
describe("toGenericBankBoxDto", () => {
  it("deve mapear todos os campos corretamente", () => {
    const mockBox = makeGenericBankBox();
    const dto = toGenericBankBoxDto(mockBox);

    expect(dto).toEqual({
      id: mockBox.id,
      genericBankId: mockBox.genericBankId,
      name: mockBox.name,
      objective: mockBox.objective,
      description: mockBox.description,
      balance: mockBox.balance,
      createdAt: mockBox.createdAt.toISOString(),
    });
  });

  it("deve retornar os valores exatos, sem transformações (exceto createdAt)", () => {
    const mockBox = makeGenericBankBox();
    const dto = toGenericBankBoxDto(mockBox);

    expect(dto.id).toBe(mockBox.id);
    expect(dto.genericBankId).toBe(mockBox.genericBankId);
    expect(dto.name).toBe(mockBox.name);
    expect(dto.objective).toBe(mockBox.objective);
    expect(dto.description).toBe(mockBox.description);
    expect(dto.balance).toBe(mockBox.balance);
    expect(dto.createdAt).toBe(mockBox.createdAt.toISOString());
  });

  it("deve converter createdAt de Date para string ISO", () => {
    const mockDate = new Date("2025-06-15T14:30:00.000Z");
    const mockBox = makeGenericBankBox({ createdAt: mockDate });
    const dto = toGenericBankBoxDto(mockBox);

    expect(dto.createdAt).toBe("2025-06-15T14:30:00.000Z");
    expect(typeof dto.createdAt).toBe("string");
  });

  it("deve ignorar campos extras da entidade (updatedAt, deletedAt, genericBank)", () => {
    const mockBox = makeGenericBankBox();
    const dto = toGenericBankBoxDto(mockBox);

    expect(dto).not.toHaveProperty("updatedAt");
    expect(dto).not.toHaveProperty("deletedAt");
    expect(dto).not.toHaveProperty("genericBank");
  });

  it("deve lidar com objective null", () => {
    const mockBox = makeGenericBankBox({ objective: null });
    const dto = toGenericBankBoxDto(mockBox);
    expect(dto.objective).toBeNull();
  });

  it("deve lidar com objective undefined", () => {
    const mockBox = makeGenericBankBox({ objective: undefined });
    const dto = toGenericBankBoxDto(mockBox);
    expect(dto.objective).toBeNull(); // fallback para null
  });

  it("deve lidar com description null", () => {
    const mockBox = makeGenericBankBox({ description: null });
    const dto = toGenericBankBoxDto(mockBox);
    expect(dto.description).toBeNull();
  });

  it("deve lidar com description undefined", () => {
    const mockBox = makeGenericBankBox({ description: undefined });
    const dto = toGenericBankBoxDto(mockBox);
    expect(dto.description).toBeNull(); // fallback para null
  });

  it("deve funcionar com objective e description ambos nulos", () => {
    const mockBox = makeGenericBankBox({ objective: null, description: null });
    const dto = toGenericBankBoxDto(mockBox);
    expect(dto.objective).toBeNull();
    expect(dto.description).toBeNull();
  });

  it("deve funcionar com balance como string", () => {
    const mockBox = makeGenericBankBox({ balance: "2500.50" });
    const dto = toGenericBankBoxDto(mockBox);
    expect(dto.balance).toBe("2500.50");
    expect(typeof dto.balance).toBe("string");
  });

  it("deve funcionar com name de 64 caracteres (limite máximo)", () => {
    const longName = "a".repeat(64);
    const mockBox = makeGenericBankBox({ name: longName });
    const dto = toGenericBankBoxDto(mockBox);
    expect(dto.name).toBe(longName);
  });

  it("deve funcionar com description de 256 caracteres (limite máximo)", () => {
    const longDescription = "a".repeat(256);
    const mockBox = makeGenericBankBox({ description: longDescription });
    const dto = toGenericBankBoxDto(mockBox);
    expect(dto.description).toBe(longDescription);
  });

  it("deve preservar o formato da data (string ISO)", () => {
    const mockBox = makeGenericBankBox();
    const dto = toGenericBankBoxDto(mockBox);

    expect(dto.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  it("deve funcionar com datas no passado", () => {
    const pastDate = new Date("2020-01-01T00:00:00.000Z");
    const mockBox = makeGenericBankBox({ createdAt: pastDate });
    const dto = toGenericBankBoxDto(mockBox);

    expect(dto.createdAt).toBe("2020-01-01T00:00:00.000Z");
  });

  it("deve funcionar com datas no futuro", () => {
    const futureDate = new Date("2030-12-31T23:59:59.999Z");
    const mockBox = makeGenericBankBox({ createdAt: futureDate });
    const dto = toGenericBankBoxDto(mockBox);

    expect(dto.createdAt).toBe("2030-12-31T23:59:59.999Z");
  });
});

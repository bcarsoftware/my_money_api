import { Pix } from "@/entities/Pix";
import { PixEnum } from "@/enums/PixEnum";
import { toPixDto } from "@/resolvers/pix/dto/toPixDto";

function makePix(overrides: Partial<Pix> = {}): Pix {
  return {
    id: "pix-123",
    bankId: "bank-456",
    tag: "Meu Pix",
    description: "Descrição opcional",
    typeKey: PixEnum.CPF,
    key: "12345678901",
    createdAt: new Date("2025-02-01T10:00:00Z"),
    updatedAt: new Date("2025-02-02T12:00:00Z"),
    deletedAt: null,
    ...overrides,
  } as Pix;
}

describe("toPixDto", () => {
  it("deve mapear todos os campos corretamente", () => {
    const mockPix = makePix();
    const dto = toPixDto(mockPix);

    expect(dto).toEqual({
      id: mockPix.id,
      bankId: mockPix.bankId,
      tag: mockPix.tag,
      description: mockPix.description,
      typeKey: mockPix.typeKey,
      key: mockPix.key,
      createdAt: mockPix.createdAt,
    });
  });

  it("deve retornar os valores exatos, sem transformações", () => {
    const mockPix = makePix();
    const dto = toPixDto(mockPix);

    expect(dto.id).toBe(mockPix.id);
    expect(dto.bankId).toBe(mockPix.bankId);
    expect(dto.tag).toBe(mockPix.tag);
    expect(dto.description).toBe(mockPix.description);
    expect(dto.typeKey).toBe(mockPix.typeKey);
    expect(dto.key).toBe(mockPix.key);
    expect(dto.createdAt).toBe(mockPix.createdAt);
  });

  it("deve ignorar campos extras da entidade (updatedAt, deletedAt, bank)", () => {
    const mockPix = makePix();
    const dto = toPixDto(mockPix);

    expect(dto).not.toHaveProperty("updatedAt");
    expect(dto).not.toHaveProperty("deletedAt");
    expect(dto).not.toHaveProperty("bank");
  });

  it("deve lidar com description null", () => {
    const mockPix = makePix();
    const pixWithoutDescription = {
      ...mockPix,
      description: null,
    } as Pix;

    const dto = toPixDto(pixWithoutDescription);
    expect(dto.description).toBeNull();
  });

  it("deve lidar com description undefined (campo opcional)", () => {
    const mockPix = makePix();
    const pixWithoutDescription: Pix = {
      ...mockPix,
      description: undefined,
    } as Pix;

    const dto = toPixDto(pixWithoutDescription);
    expect(dto.description).toBeUndefined();
  });

  it("deve funcionar com todos os tipos de chave PixEnum", () => {
    const tipos = [
      PixEnum.RANDOM,
      PixEnum.CPF,
      PixEnum.CNPJ,
      PixEnum.PHONE,
      PixEnum.EMAIL,
    ];

    const mockPix = makePix();

    tipos.forEach((tipo) => {
      const pix = { ...mockPix, typeKey: tipo } as unknown as Pix;
      const dto = toPixDto(pix);
      expect(dto.typeKey).toBe(tipo);
    });
  });

  it("deve preservar o tipo da chave (string)", () => {
    const mockPix = makePix();
    const dto = toPixDto(mockPix);
    expect(typeof dto.key).toBe("string");
  });

  it("deve funcionar com datas no passado", () => {
    const mockPix = makePix();
    const pastDate = new Date("2020-01-01T00:00:00Z");
    const pixWithPastDate = { ...mockPix, createdAt: pastDate };
    const dto = toPixDto(pixWithPastDate as unknown as Pix);
    expect(dto.createdAt).toBe(pastDate);
  });

  it("deve funcionar com tag vazia", () => {
    const mockPix = makePix();
    const pixWithEmptyTag = { ...mockPix, tag: "" };
    const dto = toPixDto(pixWithEmptyTag as unknown as Pix);
    expect(dto.tag).toBe("");
  });
});

import "reflect-metadata";

import { type MyContext } from "@/context/MyContext";
import { Pix } from "@/entities/Pix";
import { PixEnum } from "@/enums/PixEnum";
import { MessageResponse } from "@/resolvers/MessageResponse";
import { loggedContext } from "@/utils/loggedContext";
import { updatableFieldResolve } from "@/utils/updatableFieldResolve";
import { ILike } from "typeorm";
import { CreatePixInput, ListPixInput, UpdatePixInput } from "../PixInputs";
import { PixResolver } from "../PixResolver";
import { PaginatedPixDto, PixDto } from "../dto/PixDto";
import { toPixDto } from "../dto/toPixDto";

// Mocks
jest.mock("@/utils/loggedContext");
jest.mock("@/utils/updatableFieldResolve");
jest.mock("@/resolvers/pix/dto/toPixDto", () => ({
  toPixDto: jest.fn(),
}));

const mockedLoggedContext = loggedContext as jest.MockedFunction<
  typeof loggedContext
>;
const mockedUpdatableFieldResolve =
  updatableFieldResolve as jest.MockedFunction<typeof updatableFieldResolve>;
const mockedToPixDto = jest.mocked(toPixDto);

// Tipo para o EntityManager mockado
interface MockEntityManager {
  create: jest.Mock;
  save: jest.Mock;
  findOneOrFail: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  softRemove: jest.Mock;
}

function createMockEm(): MockEntityManager {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOneOrFail: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
  };
}

const userId = "user-123";
const pixId = "pix-456";

function makeMockPix(overrides: Partial<Pix> = {}): Pix {
  return {
    id: pixId,
    userId,
    bankId: "bank-789",
    tag: "Pix para emergências",
    description: "Conta de luz",
    typeKey: PixEnum.CPF,
    key: "12345678909",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    bank: null,
    ...overrides,
  } as unknown as Pix;
}

function makeMockPixDto(overrides: Partial<PixDto> = {}): PixDto {
  return {
    id: pixId,
    bankId: "bank-789",
    tag: "Pix para emergências",
    description: "Conta de luz",
    typeKey: PixEnum.CPF,
    key: "12345678909",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("PixResolver", () => {
  let resolver: PixResolver;
  let mockContext: MyContext;
  let mockEm: MockEntityManager;
  let mockPix: Pix;

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  beforeEach(() => {
    resolver = new PixResolver();
    mockContext = { userId } as MyContext;
    mockEm = createMockEm();
    mockPix = makeMockPix();

    mockedLoggedContext.mockImplementation(async (ctx, callback) => {
      return callback(mockEm as unknown as Parameters<typeof callback>[0]);
    });

    mockedUpdatableFieldResolve.mockImplementation(
      (input, current) => input ?? current
    );

    mockedToPixDto.mockImplementation((pix: Pix) => ({
      id: pix.id,
      bankId: pix.bankId,
      tag: pix.tag,
      description: pix.description,
      typeKey: pix.typeKey,
      key: pix.key,
      createdAt: pix.createdAt.toISOString(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // listPix
  // ============================================================
  describe("listPix", () => {
    const listInput: ListPixInput = {
      limit: 10,
      offset: 0,
      tag: "pix",
    };

    it("deve retornar uma lista paginada de PIX com filtro de tag", async () => {
      const mockItems = [mockPix];
      const mockTotal = 1;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listPix(mockContext, listInput);

      const expectedItems = mockItems.map((p) => ({
        id: p.id,
        bankId: p.bankId,
        tag: p.tag,
        description: p.description,
        typeKey: p.typeKey,
        key: p.key,
        createdAt: p.createdAt.toISOString(),
      }));

      expect(result).toEqual<PaginatedPixDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findAndCount).toHaveBeenCalledWith(Pix, {
        where: {
          userId,
          tag: ILike(`%${listInput.tag}%`),
        },
        take: listInput.limit,
        skip: listInput.offset,
      });
    });

    it("deve retornar uma lista paginada de PIX sem filtro de tag", async () => {
      const inputSemTag: ListPixInput = { limit: 5, offset: 0 };
      const mockItems = [mockPix];
      const mockTotal = 1;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listPix(mockContext, inputSemTag);

      const expectedItems = mockItems.map((p) => ({
        id: p.id,
        bankId: p.bankId,
        tag: p.tag,
        description: p.description,
        typeKey: p.typeKey,
        key: p.key,
        createdAt: p.createdAt.toISOString(),
      }));

      expect(result).toEqual<PaginatedPixDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockEm.findAndCount).toHaveBeenCalledWith(Pix, {
        where: { userId },
        take: inputSemTag.limit,
        skip: inputSemTag.offset,
      });
    });

    it("deve lançar erro se a consulta falhar", async () => {
      mockEm.findAndCount.mockRejectedValue(new Error("DB error"));

      await expect(resolver.listPix(mockContext, {})).rejects.toThrow(
        "Failed to list pix."
      );

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });

    describe("bankId", () => {
      it("deve filtrar por bankId quando fornecido", async () => {
        const bankId = "550e8400-e29b-41d4-a716-446655440000";
        const inputComBankId: ListPixInput = {
          limit: 10,
          offset: 0,
          bankId,
        };
        const mockItems = [mockPix];
        const mockTotal = 1;
        mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

        const result = await resolver.listPix(mockContext, inputComBankId);

        const expectedItems = mockItems.map((p) => ({
          id: p.id,
          bankId: p.bankId,
          tag: p.tag,
          description: p.description,
          typeKey: p.typeKey,
          key: p.key,
          createdAt: p.createdAt.toISOString(),
        }));

        expect(result).toEqual<PaginatedPixDto>({
          items: expectedItems,
          total: mockTotal,
        });

        expect(mockEm.findAndCount).toHaveBeenCalledWith(Pix, {
          where: {
            userId,
            bankId,
          },
          take: inputComBankId.limit,
          skip: inputComBankId.offset,
        });
      });

      it("deve ignorar bankId quando não fornecido (undefined)", async () => {
        const inputSemBankId: ListPixInput = { limit: 5, offset: 0 };
        const mockItems = [mockPix];
        const mockTotal = 1;
        mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

        const result = await resolver.listPix(mockContext, inputSemBankId);

        const expectedItems = mockItems.map((p) => ({
          id: p.id,
          bankId: p.bankId,
          tag: p.tag,
          description: p.description,
          typeKey: p.typeKey,
          key: p.key,
          createdAt: p.createdAt.toISOString(),
        }));

        expect(result).toEqual<PaginatedPixDto>({
          items: expectedItems,
          total: mockTotal,
        });

        expect(mockEm.findAndCount).toHaveBeenCalledWith(Pix, {
          where: { userId },
          take: inputSemBankId.limit,
          skip: inputSemBankId.offset,
        });
      });

      it("deve combinar filtros de bankId e tag quando ambos são fornecidos", async () => {
        const bankId = "550e8400-e29b-41d4-a716-446655440000";
        const inputComBankIdETag: ListPixInput = {
          limit: 10,
          offset: 0,
          bankId,
          tag: "pix",
        };
        const mockItems = [mockPix];
        const mockTotal = 1;
        mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

        const result = await resolver.listPix(mockContext, inputComBankIdETag);

        const expectedItems = mockItems.map((p) => ({
          id: p.id,
          bankId: p.bankId,
          tag: p.tag,
          description: p.description,
          typeKey: p.typeKey,
          key: p.key,
          createdAt: p.createdAt.toISOString(),
        }));

        expect(result).toEqual<PaginatedPixDto>({
          items: expectedItems,
          total: mockTotal,
        });

        expect(mockEm.findAndCount).toHaveBeenCalledWith(Pix, {
          where: {
            userId,
            bankId,
            tag: ILike(`%${inputComBankIdETag.tag}%`),
          },
          take: inputComBankIdETag.limit,
          skip: inputComBankIdETag.offset,
        });
      });

      it("deve ignorar bankId quando for undefined", async () => {
        const inputComBankIdUndefined: ListPixInput = {
          limit: 5,
          offset: 0,
          bankId: undefined,
        };
        const mockItems = [mockPix];
        const mockTotal = 1;
        mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

        const result = await resolver.listPix(
          mockContext,
          inputComBankIdUndefined
        );

        const expectedItems = mockItems.map((p) => ({
          id: p.id,
          bankId: p.bankId,
          tag: p.tag,
          description: p.description,
          typeKey: p.typeKey,
          key: p.key,
          createdAt: p.createdAt.toISOString(),
        }));

        expect(result).toEqual<PaginatedPixDto>({
          items: expectedItems,
          total: mockTotal,
        });

        expect(mockEm.findAndCount).toHaveBeenCalledWith(Pix, {
          where: { userId },
          take: inputComBankIdUndefined.limit,
          skip: inputComBankIdUndefined.offset,
        });
      });
    });
  });

  // ============================================================
  // createPix
  // ============================================================
  describe("createPix", () => {
    const createInput: CreatePixInput = {
      bankId: "bank-789",
      tag: "Pix para emergências",
      description: "Conta de luz",
      typeKey: PixEnum.CPF,
      key: "12345678909",
    };

    it("deve criar um novo PIX com sucesso", async () => {
      const createdPix = makeMockPix();
      mockEm.create.mockReturnValue(createdPix);
      mockEm.save.mockResolvedValue(createdPix);

      const result = await resolver.createPix(mockContext, createInput);

      const expectedDto = {
        id: createdPix.id,
        bankId: createdPix.bankId,
        tag: createdPix.tag,
        description: createdPix.description,
        typeKey: createdPix.typeKey,
        key: createdPix.key,
        createdAt: createdPix.createdAt.toISOString(),
      };

      expect(result).toEqual<PixDto>(expectedDto);
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.create).toHaveBeenCalledWith(Pix, {
        ...createInput,
        userId,
      });
      expect(mockEm.save).toHaveBeenCalledWith(createdPix);
    });

    it("deve lançar erro se a criação falhar", async () => {
      mockEm.create.mockReturnValue({});
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.createPix(mockContext, createInput)
      ).rejects.toThrow("Failed to create pix.");

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });
  });

  // ============================================================
  // updatePix
  // ============================================================
  describe("updatePix", () => {
    const updateInput: UpdatePixInput = {
      tag: "Novo tag",
      description: "Nova descrição",
      key: "31731106092",
      typeKey: PixEnum.CPF,
    };

    it("deve atualizar um PIX existente com sucesso", async () => {
      const originalDescription = mockPix.description;

      const updatedPix = makeMockPix({
        tag: updateInput.tag,
        description: updateInput.description,
        key: updateInput.key,
        typeKey: updateInput.typeKey,
      });

      // O DTO esperado deve ter createdAt como string
      const expectedDto = {
        id: updatedPix.id,
        bankId: updatedPix.bankId,
        tag: updatedPix.tag,
        description: updatedPix.description,
        typeKey: updatedPix.typeKey,
        key: updatedPix.key,
        createdAt: updatedPix.createdAt.toISOString(),
      };

      mockEm.findOneOrFail.mockResolvedValue(mockPix);
      mockEm.save.mockResolvedValue(updatedPix);

      const result = await resolver.updatePix(mockContext, pixId, updateInput);

      expect(result).toEqual(expectedDto);
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findOneOrFail).toHaveBeenCalledWith(Pix, {
        where: { id: pixId, userId },
      });

      expect(mockPix.tag).toBe(updateInput.tag);
      expect(mockPix.key).toBe(updateInput.key);
      expect(mockPix.typeKey).toBe(updateInput.typeKey);

      expect(mockedUpdatableFieldResolve).toHaveBeenCalledWith(
        updateInput.description,
        originalDescription
      );
      expect(mockPix.description).toBe(updateInput.description);

      expect(mockEm.save).toHaveBeenCalledWith(mockPix);
    });

    it("deve ignorar campos undefined (operador nullish)", async () => {
      const inputParcial: UpdatePixInput = {
        tag: "Tag atualizada",
      };
      const originalDescription = mockPix.description;

      mockEm.findOneOrFail.mockResolvedValue(mockPix);
      mockEm.save.mockResolvedValue(mockPix);

      await resolver.updatePix(mockContext, pixId, inputParcial);

      expect(mockPix.tag).toBe("Tag atualizada");
      expect(mockPix.key).toBe("12345678909");
      expect(mockPix.typeKey).toBe(PixEnum.CPF);

      expect(mockedUpdatableFieldResolve).toHaveBeenCalledWith(
        inputParcial.description,
        originalDescription
      );
      expect(mockPix.description).toBe("Conta de luz");
    });

    it("deve permitir atualizar description para null (usando updatableFieldResolve)", async () => {
      const inputComDescriptionNull: UpdatePixInput = {
        description: null,
      };
      const originalDescription = mockPix.description;

      mockEm.findOneOrFail.mockResolvedValue(mockPix);
      mockEm.save.mockResolvedValue(mockPix);

      mockedUpdatableFieldResolve.mockImplementationOnce((input, current) => {
        if (input === null) return null;
        return input ?? current;
      });

      await resolver.updatePix(mockContext, pixId, inputComDescriptionNull);

      expect(mockedUpdatableFieldResolve).toHaveBeenCalledWith(
        null,
        originalDescription
      );
      expect(mockPix.description).toBeNull();
    });

    it("deve lançar erro se o PIX não for encontrado", async () => {
      const inputValido = {
        key: "12345678909",
        typeKey: PixEnum.CPF,
      };
      mockEm.findOneOrFail.mockRejectedValue(new Error("Not found"));

      await expect(
        resolver.updatePix(mockContext, pixId, inputValido)
      ).rejects.toThrow("Failed to update pix.");

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });

    it("deve lançar erro se a atualização falhar", async () => {
      const inputValido = {
        key: "12227044047",
        typeKey: PixEnum.CPF,
      };
      mockEm.findOneOrFail.mockResolvedValue(mockPix);
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.updatePix(mockContext, pixId, inputValido)
      ).rejects.toThrow("Failed to update pix.");
    });
  });

  // ============================================================
  // deletePix
  // ============================================================
  describe("deletePix", () => {
    it("deve deletar (soft delete) um PIX com sucesso", async () => {
      mockEm.findOne.mockResolvedValue(mockPix);
      mockEm.softRemove.mockResolvedValue({} as Pix);

      const result = await resolver.deletePix(mockContext, pixId);

      expect(result).toEqual<MessageResponse>({
        message: "Pix deleted successfully.",
      });
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findOne).toHaveBeenCalledWith(Pix, {
        where: { id: pixId, userId },
      });
      expect(mockEm.softRemove).toHaveBeenCalledWith(mockPix);
    });

    it("deve lançar erro se o PIX não for encontrado", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(resolver.deletePix(mockContext, pixId)).rejects.toThrow(
        "Failed to delete pix."
      );

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.softRemove).not.toHaveBeenCalled();
    });

    it("deve lançar erro se a exclusão falhar", async () => {
      mockEm.findOne.mockResolvedValue(mockPix);
      mockEm.softRemove.mockRejectedValue(new Error("DB error"));

      await expect(resolver.deletePix(mockContext, pixId)).rejects.toThrow(
        "Failed to delete pix."
      );
    });
  });
});

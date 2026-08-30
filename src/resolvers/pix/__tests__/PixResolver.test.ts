import "reflect-metadata";

import { type MyContext } from "@/context/MyContext";
import { Pix } from "@/entities/Pix";
import { PixEnum } from "@/enums/PixEnum";
import { MessageResponse } from "@/resolvers/MessageResponse";
import { loggedContext } from "@/utils/loggedContext";
import { updatableFieldResolve } from "@/utils/updatableFieldResolve";
import { ILike } from "typeorm";
import { CreatePixInput, ListPixInput, UpdatePixInput } from "../PixInput";
import { PixResolver } from "../PixResolver";
import { PaginatedPixDto, PixDto } from "../dto/PixDto";

// Mocks
jest.mock("@/utils/loggedContext");
jest.mock("@/utils/updatableFieldResolve");

// Definição de tipos para os mocks
const mockedLoggedContext = loggedContext as jest.MockedFunction<
  typeof loggedContext
>;
const mockedUpdatableFieldResolve =
  updatableFieldResolve as jest.MockedFunction<typeof updatableFieldResolve>;

// Tipo para o EntityManager mockado (apenas os métodos usados)
interface MockEntityManager {
  create: jest.Mock;
  save: jest.Mock;
  findOneOrFail: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  softRemove: jest.Mock;
}

// Helper para criar um mock de EntityManager
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

/**
 * Fábrica de um Pix "fresco" a cada teste. Isso é essencial: o resolver
 * muta diretamente o objeto retornado por findOneOrFail (money.tag = ...,
 * etc.), então reusar a MESMA instância entre testes faz um teste vazar
 * mutação para o próximo.
 */
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

    // Configura o mock do loggedContext para executar o callback com o em mockado
    mockedLoggedContext.mockImplementation(async (ctx, callback) => {
      return callback(mockEm as unknown as Parameters<typeof callback>[0]);
    });

    // Mock do updatableFieldResolve para retornar o valor recebido (comportamento padrão)
    mockedUpdatableFieldResolve.mockImplementation(
      (input, current) => input ?? current
    );
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

      expect(result).toEqual<PaginatedPixDto>({
        items: mockItems,
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

      expect(result).toEqual<PaginatedPixDto>({
        items: mockItems,
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
        "DB error"
      );

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
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
      const createdPix = { ...mockPix };
      mockEm.create.mockReturnValue(createdPix);
      mockEm.save.mockResolvedValue(createdPix);

      const result = await resolver.createPix(mockContext, createInput);

      expect(result).toEqual<PixDto>(createdPix);
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
      ).rejects.toThrow("DB error");

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
      key: "98765432100",
    };

    it("deve atualizar um PIX existente com sucesso", async () => {
      // Captura o valor ORIGINAL antes de chamar o resolver — depois da
      // chamada, mockPix.description já estará mutado para o novo valor,
      // então comparar com mockPix.description nesse ponto compararia o
      // valor novo consigo mesmo, mascarando qualquer regressão real.
      const originalDescription = mockPix.description;

      const updatedPix = {
        ...mockPix,
        tag: "Novo tag",
        description: "Nova descrição",
        key: "98765432100",
      };
      mockEm.findOneOrFail.mockResolvedValue(mockPix);
      mockEm.save.mockResolvedValue(updatedPix);

      const result = await resolver.updatePix(mockContext, pixId, updateInput);

      expect(result).toEqual<PixDto>(updatedPix);
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findOneOrFail).toHaveBeenCalledWith(Pix, {
        where: { id: pixId, userId },
      });

      // Verifica que os campos foram atualizados usando os operadores nullish
      expect(mockPix.tag).toBe("Novo tag");
      expect(mockPix.key).toBe("98765432100");

      // Verifica que description usou updatableFieldResolve, com o valor
      // ATUAL (antes da mutação) como "current"
      expect(mockedUpdatableFieldResolve).toHaveBeenCalledWith(
        updateInput.description,
        originalDescription
      );
      expect(mockPix.description).toBe("Nova descrição");

      expect(mockEm.save).toHaveBeenCalledWith(mockPix);
    });

    it("deve ignorar campos undefined (operador nullish)", async () => {
      const inputParcial: UpdatePixInput = {
        tag: undefined,
        key: undefined,
      };
      const originalDescription = mockPix.description;

      mockEm.findOneOrFail.mockResolvedValue(mockPix);
      mockEm.save.mockResolvedValue(mockPix);

      await resolver.updatePix(mockContext, pixId, inputParcial);

      // tag e key não devem ser alterados
      expect(mockPix.tag).toBe("Pix para emergências");
      expect(mockPix.key).toBe("12345678909");
      // description também não deve mudar (updatableFieldResolve será chamado com undefined)
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

      // Simula que o updatableFieldResolve retorna null
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
      mockEm.findOneOrFail.mockRejectedValue(new Error("Not found"));

      await expect(
        resolver.updatePix(mockContext, pixId, updateInput)
      ).rejects.toThrow("Not found");

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });

    it("deve lançar erro se a atualização falhar", async () => {
      mockEm.findOneOrFail.mockResolvedValue(mockPix);
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.updatePix(mockContext, pixId, updateInput)
      ).rejects.toThrow("DB error");
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
        "Pix not found"
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
        "DB error"
      );
    });
  });
});

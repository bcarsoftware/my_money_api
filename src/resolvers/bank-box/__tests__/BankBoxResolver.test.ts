import "reflect-metadata";

import { type MyContext } from "@/context/MyContext";
import { BankBox } from "@/entities/BankBox";
import { MessageResponse } from "@/resolvers/MessageResponse";
import { toBankBoxDto } from "@/resolvers/bank-box/dto/toBankBoxDto";
import { loggedContext } from "@/utils/loggedContext";
import { updatableFieldResolve } from "@/utils/updatableFieldResolve";
import { ILike } from "typeorm";
import {
  CreateBankBoxInput,
  ListBankBoxInput,
  UpdateBankBoxInput,
} from "../BankBoxInputs";
import { BankBoxResolver } from "../BankBoxResolver";
import { PaginatedBankBoxDto } from "../dto/BankBoxDto";

// ============================================================
// Mocks (devem vir antes dos imports das funções mockadas)
// ============================================================
jest.mock("@/utils/loggedContext");
jest.mock("@/utils/updatableFieldResolve");
jest.mock("@/resolvers/bank-box/dto/toBankBoxDto", () => ({
  toBankBoxDto: jest.fn(),
}));

const mockedLoggedContext = loggedContext as jest.MockedFunction<
  typeof loggedContext
>;
const mockedUpdatableFieldResolve =
  updatableFieldResolve as jest.MockedFunction<typeof updatableFieldResolve>;
const mockedToBankBoxDto = jest.mocked(toBankBoxDto);

// Tipo para o EntityManager mockado
interface MockEntityManager {
  create: jest.Mock;
  save: jest.Mock;
  findOneOrFail: jest.Mock;
  findAndCount: jest.Mock;
  softRemove: jest.Mock;
}

// Helper para criar um mock de EntityManager
function createMockEm(): MockEntityManager {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOneOrFail: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
  };
}

// Factory para criar um BankBox mockado
function makeMockBankBox(overrides: Partial<BankBox> = {}): BankBox {
  return {
    id: "bankbox-123",
    userId: "user-123",
    bankId: "bank-456",
    tag: "Minha Caixa",
    objective: "1000.00",
    description: "Descrição da caixa",
    balance: "5000.00",
    createdAt: new Date("2025-02-01T10:00:00Z"),
    updatedAt: new Date("2025-02-02T12:00:00Z"),
    deletedAt: null,
    bank: null,
    ...overrides,
  } as BankBox;
}

describe("BankBoxResolver", () => {
  let resolver: BankBoxResolver;
  let mockContext: MyContext;
  let mockEm: MockEntityManager;
  let mockBankBox: BankBox;

  const userId = "user-123";
  const bankBoxId = "bankbox-123";

  beforeEach(() => {
    resolver = new BankBoxResolver();
    mockContext = { userId } as MyContext;
    mockEm = createMockEm();
    mockBankBox = makeMockBankBox();

    // Mock do loggedContext para executar o callback com o em mockado
    mockedLoggedContext.mockImplementation(async (ctx, callback) => {
      return callback(mockEm as unknown as Parameters<typeof callback>[0]);
    });

    // Mock do updatableFieldResolve para retornar o valor recebido (comportamento padrão)
    mockedUpdatableFieldResolve.mockImplementation(
      (input, current) => input ?? current
    );

    // Mock do toBankBoxDto para retornar exatamente o que a função real retorna
    mockedToBankBoxDto.mockImplementation((bankBox: BankBox) => ({
      id: bankBox.id,
      bankId: bankBox.bankId,
      tag: bankBox.tag,
      objective: bankBox.objective,
      description: bankBox.description,
      balance: bankBox.balance,
      createdAt: bankBox.createdAt.toISOString(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // listBankBox
  // ============================================================
  describe("listBankBox", () => {
    const listInput: ListBankBoxInput = {
      limit: 10,
      offset: 0,
      tag: "caixa",
      bankId: "bank-456",
    };

    it("deve retornar uma lista paginada com todos os filtros", async () => {
      const mockItems = [mockBankBox];
      const mockTotal = 1;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listBankBox(mockContext, listInput);

      const expectedItems = mockItems.map((bankBox) => ({
        id: bankBox.id,
        bankId: bankBox.bankId,
        tag: bankBox.tag,
        objective: bankBox.objective,
        description: bankBox.description,
        balance: bankBox.balance,
        createdAt: bankBox.createdAt.toISOString(),
      }));

      expect(result).toEqual<PaginatedBankBoxDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findAndCount).toHaveBeenCalledWith(BankBox, {
        where: {
          userId,
          tag: ILike(`%${listInput.tag}%`),
          bankId: listInput.bankId,
        },
        take: listInput.limit,
        skip: listInput.offset,
      });
    });

    it("deve retornar lista paginada sem filtro de tag (quando não fornecido)", async () => {
      const inputSemTag: ListBankBoxInput = { limit: 5, offset: 0 };
      const mockItems = [mockBankBox];
      const mockTotal = 1;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listBankBox(mockContext, inputSemTag);

      const expectedItems = mockItems.map((bankBox) => ({
        id: bankBox.id,
        bankId: bankBox.bankId,
        tag: bankBox.tag,
        objective: bankBox.objective,
        description: bankBox.description,
        balance: bankBox.balance,
        createdAt: bankBox.createdAt.toISOString(),
      }));

      expect(result).toEqual<PaginatedBankBoxDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockEm.findAndCount).toHaveBeenCalledWith(BankBox, {
        where: { userId },
        take: inputSemTag.limit,
        skip: inputSemTag.offset,
      });
    });

    it("deve retornar lista paginada sem filtro de bankId (quando não fornecido)", async () => {
      const inputSemBankId: ListBankBoxInput = {
        limit: 5,
        offset: 0,
        tag: "caixa",
      };
      const mockItems = [mockBankBox];
      const mockTotal = 1;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listBankBox(mockContext, inputSemBankId);

      const expectedItems = mockItems.map((bankBox) => ({
        id: bankBox.id,
        bankId: bankBox.bankId,
        tag: bankBox.tag,
        objective: bankBox.objective,
        description: bankBox.description,
        balance: bankBox.balance,
        createdAt: bankBox.createdAt.toISOString(),
      }));

      expect(result).toEqual<PaginatedBankBoxDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockEm.findAndCount).toHaveBeenCalledWith(BankBox, {
        where: {
          userId,
          tag: ILike(`%caixa%`),
        },
        take: inputSemBankId.limit,
        skip: inputSemBankId.offset,
      });
    });

    it("deve ignorar tag quando for undefined", async () => {
      const inputComTagUndefined: ListBankBoxInput = {
        limit: 5,
        offset: 0,
        tag: undefined,
      };
      const mockItems = [mockBankBox];
      const mockTotal = 1;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listBankBox(
        mockContext,
        inputComTagUndefined
      );

      const expectedItems = mockItems.map((bankBox) => ({
        id: bankBox.id,
        bankId: bankBox.bankId,
        tag: bankBox.tag,
        objective: bankBox.objective,
        description: bankBox.description,
        balance: bankBox.balance,
        createdAt: bankBox.createdAt.toISOString(),
      }));

      expect(result).toEqual<PaginatedBankBoxDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockEm.findAndCount).toHaveBeenCalledWith(BankBox, {
        where: { userId },
        take: inputComTagUndefined.limit,
        skip: inputComTagUndefined.offset,
      });
    });

    it("deve ignorar bankId quando for undefined", async () => {
      const inputComBankIdUndefined: ListBankBoxInput = {
        limit: 5,
        offset: 0,
        bankId: undefined,
      };
      const mockItems = [mockBankBox];
      const mockTotal = 1;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listBankBox(
        mockContext,
        inputComBankIdUndefined
      );

      const expectedItems = mockItems.map((bankBox) => ({
        id: bankBox.id,
        bankId: bankBox.bankId,
        tag: bankBox.tag,
        objective: bankBox.objective,
        description: bankBox.description,
        balance: bankBox.balance,
        createdAt: bankBox.createdAt.toISOString(),
      }));

      expect(result).toEqual<PaginatedBankBoxDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockEm.findAndCount).toHaveBeenCalledWith(BankBox, {
        where: { userId },
        take: inputComBankIdUndefined.limit,
        skip: inputComBankIdUndefined.offset,
      });
    });

    it("deve lançar erro se a consulta falhar", async () => {
      mockEm.findAndCount.mockRejectedValue(new Error("DB error"));

      await expect(resolver.listBankBox(mockContext, {})).rejects.toThrow(
        "DB error"
      );

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });
  });

  // ============================================================
  // createBankBox
  // ============================================================
  describe("createBankBox", () => {
    const createInput: CreateBankBoxInput = {
      bankId: "bank-456",
      tag: "Nova Caixa",
      objective: "2000.00",
      description: "Descrição da nova caixa",
      balance: "10000.00",
    };

    it("deve criar um BankBox com sucesso", async () => {
      const createdBankBox = makeMockBankBox({
        ...createInput,
        userId,
      } as Partial<BankBox>);
      mockEm.create.mockReturnValue(createdBankBox);
      mockEm.save.mockResolvedValue(createdBankBox);

      const result = await resolver.createBankBox(mockContext, createInput);

      expect(result).toEqual({
        id: createdBankBox.id,
        bankId: createdBankBox.bankId,
        tag: createdBankBox.tag,
        objective: createdBankBox.objective,
        description: createdBankBox.description,
        balance: createdBankBox.balance,
        createdAt: createdBankBox.createdAt.toISOString(),
      });
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.create).toHaveBeenCalledWith(BankBox, {
        ...createInput,
        userId,
      });
      expect(mockEm.save).toHaveBeenCalledWith(createdBankBox);
    });

    it("deve lançar erro se a criação falhar", async () => {
      mockEm.create.mockReturnValue({});
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.createBankBox(mockContext, createInput)
      ).rejects.toThrow("DB error");

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });
  });

  // ============================================================
  // updateBankBox
  // ============================================================
  describe("updateBankBox", () => {
    const updateInput: UpdateBankBoxInput = {
      bankId: "bank-456",
      tag: "Tag Atualizada",
      description: "Nova descrição",
    };

    it("deve atualizar um BankBox existente com sucesso", async () => {
      const originalDescription = mockBankBox.description;
      const originalObjective = mockBankBox.objective;

      const updatedBankBox = makeMockBankBox({
        ...mockBankBox,
        tag: updateInput.tag,
        description: updateInput.description,
      });

      mockEm.findOneOrFail.mockResolvedValue(mockBankBox);
      mockEm.save.mockResolvedValue(updatedBankBox);

      const result = await resolver.updateBankBox(
        mockContext,
        bankBoxId,
        updateInput
      );

      expect(result).toEqual({
        id: updatedBankBox.id,
        bankId: updatedBankBox.bankId,
        tag: updatedBankBox.tag,
        objective: updatedBankBox.objective,
        description: updatedBankBox.description,
        balance: updatedBankBox.balance,
        createdAt: updatedBankBox.createdAt.toISOString(),
      });
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findOneOrFail).toHaveBeenCalledWith(BankBox, {
        where: { id: bankBoxId, userId },
      });

      expect(mockBankBox.tag).toBe(updateInput.tag);

      expect(mockedUpdatableFieldResolve).toHaveBeenCalledWith(
        updateInput.description,
        originalDescription
      );
      expect(mockBankBox.description).toBe(updateInput.description);

      expect(mockedUpdatableFieldResolve).toHaveBeenCalledWith(
        updateInput.objective,
        originalObjective
      );
      expect(mockBankBox.objective).toBe(originalObjective);

      expect(mockEm.save).toHaveBeenCalledWith(mockBankBox);
    });

    it("deve ignorar campos undefined (operador nullish)", async () => {
      const inputParcial: UpdateBankBoxInput = {
        bankId: "bank-456",
        tag: "Tag Parcial",
      };
      const originalDescription = mockBankBox.description;
      const originalObjective = mockBankBox.objective;

      mockEm.findOneOrFail.mockResolvedValue(mockBankBox);
      mockEm.save.mockResolvedValue(mockBankBox);

      await resolver.updateBankBox(mockContext, bankBoxId, inputParcial);

      expect(mockBankBox.tag).toBe("Tag Parcial");
      expect(mockBankBox.bankId).toBe("bank-456");
      expect(mockBankBox.balance).toBe("5000.00");

      expect(mockedUpdatableFieldResolve).toHaveBeenCalledWith(
        inputParcial.description,
        originalDescription
      );
      expect(mockedUpdatableFieldResolve).toHaveBeenCalledWith(
        inputParcial.objective,
        originalObjective
      );
      expect(mockBankBox.description).toBe(originalDescription);
      expect(mockBankBox.objective).toBe(originalObjective);
    });

    it("deve permitir atualizar description para null (usando updatableFieldResolve)", async () => {
      const inputComDescriptionNull: UpdateBankBoxInput = {
        bankId: "bank-456",
        description: null,
      };
      const originalDescription = mockBankBox.description;

      mockEm.findOneOrFail.mockResolvedValue(mockBankBox);
      mockEm.save.mockResolvedValue(mockBankBox);

      mockedUpdatableFieldResolve.mockImplementation((input, current) => {
        if (input === null) return null;
        return input ?? current;
      });

      await resolver.updateBankBox(
        mockContext,
        bankBoxId,
        inputComDescriptionNull
      );

      expect(mockedUpdatableFieldResolve).toHaveBeenCalledWith(
        null,
        originalDescription
      );
      expect(mockBankBox.description).toBeNull();
    });

    it("deve permitir atualizar objective para null (usando updatableFieldResolve)", async () => {
      const inputComObjectiveNull: UpdateBankBoxInput = {
        bankId: "bank-456",
        objective: null,
      };
      const originalObjective = mockBankBox.objective;

      mockEm.findOneOrFail.mockResolvedValue(mockBankBox);
      mockEm.save.mockResolvedValue(mockBankBox);

      mockedUpdatableFieldResolve.mockImplementation((input, current) => {
        if (input === null) return null;
        return input ?? current;
      });

      await resolver.updateBankBox(
        mockContext,
        bankBoxId,
        inputComObjectiveNull
      );

      expect(mockedUpdatableFieldResolve).toHaveBeenCalledWith(
        null,
        originalObjective
      );
      expect(mockBankBox.objective).toBeNull();
    });

    it("deve lançar erro se o BankBox não for encontrado", async () => {
      mockEm.findOneOrFail.mockRejectedValue(new Error("Not found"));

      await expect(
        resolver.updateBankBox(mockContext, bankBoxId, updateInput)
      ).rejects.toThrow("Not found");

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });

    it("deve lançar erro se a atualização falhar", async () => {
      mockEm.findOneOrFail.mockResolvedValue(mockBankBox);
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.updateBankBox(mockContext, bankBoxId, updateInput)
      ).rejects.toThrow("DB error");
    });
  });

  // ============================================================
  // deleteBankBox
  // ============================================================
  describe("deleteBankBox", () => {
    it("deve deletar (soft delete) um BankBox com sucesso", async () => {
      mockEm.findOneOrFail.mockResolvedValue(mockBankBox);
      mockEm.softRemove.mockResolvedValue({} as BankBox);

      const result = await resolver.deleteBankBox(mockContext, bankBoxId);

      expect(result).toEqual<MessageResponse>({
        message: "Bank box deleted successfully.",
      });
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findOneOrFail).toHaveBeenCalledWith(BankBox, {
        where: { id: bankBoxId, userId },
      });
      expect(mockEm.softRemove).toHaveBeenCalledWith(mockBankBox);
    });

    it("deve lançar erro se o BankBox não for encontrado", async () => {
      mockEm.findOneOrFail.mockRejectedValue(new Error("Not found"));

      await expect(
        resolver.deleteBankBox(mockContext, bankBoxId)
      ).rejects.toThrow("Not found");

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.softRemove).not.toHaveBeenCalled();
    });

    it("deve lançar erro se a exclusão falhar", async () => {
      mockEm.findOneOrFail.mockResolvedValue(mockBankBox);
      mockEm.softRemove.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.deleteBankBox(mockContext, bankBoxId)
      ).rejects.toThrow("DB error");
    });
  });
});

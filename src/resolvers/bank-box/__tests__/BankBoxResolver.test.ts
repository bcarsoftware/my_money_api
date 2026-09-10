import "reflect-metadata";

import { BANK_BOX_NOT_FOUND, USER_NOT_AUTHORIZED } from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { Bank } from "@/entities/Bank";
import { BankBox } from "@/entities/BankBox";
import { MessageResponse } from "@/resolvers/MessageResponse";
import { toBankBoxDto } from "@/resolvers/bank-box/dto/toBankBoxDto";
import { loggedContext } from "@/utils/loggedContext";
import { updatableFieldResolver } from "@/utils/updatableFieldResolverr";
import { ILike } from "typeorm";
import {
  CreateBankBoxInput,
  ListBankBoxInput,
  UpdateBankBoxInput,
} from "../BankBoxInputs";
import { BankBoxResolver } from "../BankBoxResolver";
import { PaginatedBankBoxDto } from "../dto/BankBoxDto";

// ============================================================
// Mocks
// ============================================================
jest.mock("@/utils/loggedContext");
jest.mock("@/utils/updatableFieldResolver");
jest.mock("@/resolvers/bank-box/dto/toBankBoxDto", () => ({
  toBankBoxDto: jest.fn(),
}));

const mockedLoggedContext = loggedContext as jest.MockedFunction<
  typeof loggedContext
>;
const mockedupdatableFieldResolver =
  updatableFieldResolver as jest.MockedFunction<typeof updatableFieldResolver>;
const mockedToBankBoxDto = jest.mocked(toBankBoxDto);

// ============================================================
// Types auxiliares
// ============================================================
type MockEntityManager = {
  findOne: jest.Mock;
  findOneOrFail: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  findAndCount: jest.Mock;
  softRemove: jest.Mock;
};

// ============================================================
// Factories
// ============================================================
function createMockEm(): MockEntityManager {
  return {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
  };
}

function makeMockBank(overrides: Partial<Bank> = {}): Bank {
  return {
    id: "bank-456",
    userId: "user-123",
    name: "Banco Teste",
    ...overrides,
  } as Bank;
}

function makeMockBankBox(overrides: Partial<BankBox> = {}): BankBox {
  const bank = overrides.bank !== undefined ? overrides.bank : makeMockBank();
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
    bank,
    ...overrides,
  } as BankBox;
}

// ============================================================
// Suite de testes
// ============================================================
describe("BankBoxResolver", () => {
  let resolver: BankBoxResolver;
  let mockContext: MyContext;
  let mockEm: MockEntityManager;
  let mockBank: Bank;
  let mockBankBox: BankBox;

  const userId = "user-123";
  const bankBoxId = "bankbox-123";
  const bankId = "bank-456";

  beforeEach(() => {
    resolver = new BankBoxResolver();
    mockContext = { userId } as MyContext;
    mockEm = createMockEm();
    mockBank = makeMockBank();
    mockBankBox = makeMockBankBox();

    mockedLoggedContext.mockImplementation(async (ctx, callback) => {
      return callback(mockEm as unknown as Parameters<typeof callback>[0]);
    });

    // updatableFieldResolver: retorna input se não for undefined, senão current
    mockedupdatableFieldResolver.mockImplementation((input, current) =>
      input !== undefined ? input : current
    );

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
      bankId: bankId,
    };

    it("deve retornar uma lista paginada com todos os filtros", async () => {
      const mockItems = [mockBankBox];
      const mockTotal = 1;

      mockEm.findOne.mockResolvedValueOnce(mockBank);
      mockEm.findAndCount.mockResolvedValueOnce([mockItems, mockTotal]);

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
      expect(mockEm.findOne).toHaveBeenCalledWith(Bank, {
        where: { id: listInput.bankId, userId },
      });
      expect(mockEm.findAndCount).toHaveBeenCalledWith(BankBox, {
        where: {
          bankId: listInput.bankId,
          tag: ILike(`%${listInput.tag}%`),
        },
        take: listInput.limit,
        skip: listInput.offset,
      });
    });

    it("deve lançar erro se o Bank não existir ou não pertencer ao usuário", async () => {
      mockEm.findOne.mockResolvedValueOnce(null);

      await expect(
        resolver.listBankBox(mockContext, { bankId: "invalid" })
      ).rejects.toThrow("User bank not match");

      expect(mockEm.findAndCount).not.toHaveBeenCalled();
    });

    it("deve retornar lista paginada sem filtro de tag (quando não fornecido)", async () => {
      const inputSemTag: ListBankBoxInput = {
        limit: 5,
        offset: 0,
        bankId: bankId,
      };
      const mockItems = [mockBankBox];
      const mockTotal = 1;

      mockEm.findOne.mockResolvedValueOnce(mockBank);
      mockEm.findAndCount.mockResolvedValueOnce([mockItems, mockTotal]);

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
        where: { bankId: inputSemTag.bankId },
        take: inputSemTag.limit,
        skip: inputSemTag.offset,
      });
    });

    it("deve ignorar tag quando for undefined", async () => {
      const inputComTagUndefined: ListBankBoxInput = {
        limit: 5,
        offset: 0,
        bankId: bankId,
        tag: undefined,
      };
      const mockItems = [mockBankBox];
      const mockTotal = 1;

      mockEm.findOne.mockResolvedValueOnce(mockBank);
      mockEm.findAndCount.mockResolvedValueOnce([mockItems, mockTotal]);

      const result = await resolver.listBankBox(
        mockContext,
        inputComTagUndefined
      );

      expect(mockEm.findAndCount).toHaveBeenCalledWith(BankBox, {
        where: { bankId: inputComTagUndefined.bankId },
        take: inputComTagUndefined.limit,
        skip: inputComTagUndefined.offset,
      });
      expect(result.total).toBe(mockTotal);
    });

    it("deve lançar erro se a consulta falhar", async () => {
      mockEm.findOne.mockResolvedValueOnce(mockBank);
      mockEm.findAndCount.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.listBankBox(mockContext, { bankId: bankId })
      ).rejects.toThrow("Failed to list bank boxes.");
    });
  });

  // ============================================================
  // createBankBox
  // ============================================================
  describe("createBankBox", () => {
    const createInput: CreateBankBoxInput = {
      bankId: bankId,
      tag: "Nova Caixa",
      objective: "2000.00",
      description: "Descrição da nova caixa",
      balance: "10000.00",
    };

    it("deve criar um BankBox com sucesso", async () => {
      const createdBankBox = makeMockBankBox({
        ...createInput,
        balance: "10000.00",
      });

      mockEm.findOneOrFail.mockResolvedValueOnce(mockBank);
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
      expect(mockEm.findOneOrFail).toHaveBeenCalledWith(Bank, {
        where: { id: createInput.bankId, userId },
      });
      expect(mockEm.create).toHaveBeenCalledWith(BankBox, {
        ...createInput,
        userId,
        balance: "10000.00",
      });
      expect(mockEm.save).toHaveBeenCalledWith(createdBankBox);
    });

    it("deve lançar erro se o Bank não existir", async () => {
      mockEm.findOneOrFail.mockRejectedValueOnce(new Error("Bank not found"));

      await expect(
        resolver.createBankBox(mockContext, createInput)
      ).rejects.toThrow("Failed to create bank box.");

      expect(mockEm.create).not.toHaveBeenCalled();
    });

    it("deve lançar erro se a criação falhar", async () => {
      mockEm.findOneOrFail.mockResolvedValueOnce(mockBank);
      mockEm.create.mockReturnValue({});
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.createBankBox(mockContext, createInput)
      ).rejects.toThrow("Failed to create bank box.");
    });
  });

  // ============================================================
  // updateBankBox
  // ============================================================
  describe("updateBankBox", () => {
    const updateInput: UpdateBankBoxInput = {
      tag: "Tag Atualizada",
      description: "Nova descrição",
    };

    it("deve atualizar um BankBox existente com sucesso", async () => {
      const existingBox = makeMockBankBox();
      const updatedBox = makeMockBankBox({
        ...existingBox,
        tag: updateInput.tag,
        description: updateInput.description,
        objective: existingBox.objective,
      });

      mockEm.findOne.mockResolvedValueOnce(existingBox);
      mockEm.save.mockResolvedValueOnce(updatedBox);

      const result = await resolver.updateBankBox(
        mockContext,
        bankBoxId,
        updateInput
      );

      expect(result).toEqual({
        id: updatedBox.id,
        bankId: updatedBox.bankId,
        tag: updatedBox.tag,
        objective: updatedBox.objective,
        description: updatedBox.description,
        balance: updatedBox.balance,
        createdAt: updatedBox.createdAt.toISOString(),
      });

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findOne).toHaveBeenCalledWith(BankBox, {
        where: { id: bankBoxId },
        relations: { bank: true },
      });

      // Verifica se os campos foram atualizados corretamente
      expect(existingBox.tag).toBe(updateInput.tag);
      expect(existingBox.description).toBe(updateInput.description);
      expect(existingBox.objective).toBe("1000.00"); // não foi alterado

      // Verifica as chamadas do updatableFieldResolver
      // Primeira chamada: description (input, valor atual)
      expect(mockedupdatableFieldResolver).toHaveBeenNthCalledWith(
        1,
        updateInput.description,
        "Descrição da caixa"
      );
      // Segunda chamada: objective (undefined, valor atual)
      expect(mockedupdatableFieldResolver).toHaveBeenNthCalledWith(
        2,
        undefined,
        "1000.00"
      );

      expect(mockEm.save).toHaveBeenCalledWith(existingBox);
    });

    it("deve lançar erro se o BankBox não existir", async () => {
      mockEm.findOne.mockResolvedValueOnce(null);

      await expect(
        resolver.updateBankBox(mockContext, bankBoxId, updateInput)
      ).rejects.toThrow(BANK_BOX_NOT_FOUND);
    });

    it("deve lançar erro se o usuário não for autorizado", async () => {
      const bankDeOutroUsuario = makeMockBank({ userId: "other-user" });
      const boxComBankDeOutro = makeMockBankBox({ bank: bankDeOutroUsuario });

      mockEm.findOne.mockResolvedValueOnce(boxComBankDeOutro);

      await expect(
        resolver.updateBankBox(mockContext, bankBoxId, updateInput)
      ).rejects.toThrow(USER_NOT_AUTHORIZED);

      expect(mockEm.save).not.toHaveBeenCalled();
    });

    it("deve ignorar campos undefined (operador nullish)", async () => {
      const inputParcial: UpdateBankBoxInput = {
        tag: "Tag Parcial",
      };
      const existingBox = makeMockBankBox();

      mockEm.findOne.mockResolvedValueOnce(existingBox);
      mockEm.save.mockResolvedValueOnce(existingBox);

      await resolver.updateBankBox(mockContext, bankBoxId, inputParcial);

      expect(existingBox.tag).toBe("Tag Parcial");
      expect(existingBox.description).toBe("Descrição da caixa");
      expect(existingBox.objective).toBe("1000.00");
    });

    it("deve permitir atualizar description para null", async () => {
      const inputComDescriptionNull: UpdateBankBoxInput = {
        description: null,
      };
      const existingBox = makeMockBankBox();

      mockEm.findOne.mockResolvedValueOnce(existingBox);
      mockEm.save.mockResolvedValueOnce(existingBox);

      await resolver.updateBankBox(
        mockContext,
        bankBoxId,
        inputComDescriptionNull
      );

      // Verifica a chamada com null
      expect(mockedupdatableFieldResolver).toHaveBeenNthCalledWith(
        1,
        null,
        "Descrição da caixa"
      );
      // Segunda chamada: objective (undefined)
      expect(mockedupdatableFieldResolver).toHaveBeenNthCalledWith(
        2,
        undefined,
        "1000.00"
      );

      // O campo deve ter sido atualizado para null
      expect(existingBox.description).toBeNull();
    });

    it("deve permitir atualizar objective para null", async () => {
      const inputComObjectiveNull: UpdateBankBoxInput = {
        objective: null,
      };
      const existingBox = makeMockBankBox();

      mockEm.findOne.mockResolvedValueOnce(existingBox);
      mockEm.save.mockResolvedValueOnce(existingBox);

      await resolver.updateBankBox(
        mockContext,
        bankBoxId,
        inputComObjectiveNull
      );

      // Primeira chamada: description (undefined)
      expect(mockedupdatableFieldResolver).toHaveBeenNthCalledWith(
        1,
        undefined,
        "Descrição da caixa"
      );
      // Segunda chamada: objective (null)
      expect(mockedupdatableFieldResolver).toHaveBeenNthCalledWith(
        2,
        null,
        "1000.00"
      );

      expect(existingBox.objective).toBeNull();
    });

    it("deve lançar erro genérico se a atualização falhar", async () => {
      const existingBox = makeMockBankBox();
      mockEm.findOne.mockResolvedValueOnce(existingBox);
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.updateBankBox(mockContext, bankBoxId, updateInput)
      ).rejects.toThrow("Failed to update bank box.");
    });
  });

  // ============================================================
  // deleteBankBox
  // ============================================================
  describe("deleteBankBox", () => {
    it("deve deletar (soft delete) um BankBox com sucesso", async () => {
      const bankBoxComBank = makeMockBankBox({ bank: mockBank });

      mockEm.findOneOrFail.mockResolvedValueOnce(bankBoxComBank);
      mockEm.softRemove.mockResolvedValueOnce({} as BankBox);

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
        relations: { bank: true },
      });
      expect(mockEm.softRemove).toHaveBeenCalledWith(bankBoxComBank);
    });

    it("deve lançar erro genérico se o BankBox não for encontrado", async () => {
      mockEm.findOneOrFail.mockRejectedValueOnce(new Error("Not found"));

      await expect(
        resolver.deleteBankBox(mockContext, bankBoxId)
      ).rejects.toThrow("Failed to delete bank box.");

      expect(mockEm.softRemove).not.toHaveBeenCalled();
    });

    it("deve lançar erro genérico se o usuário não for autorizado", async () => {
      const bankDeOutro = makeMockBank({ userId: "other-user" });
      const boxComBankOutro = makeMockBankBox({ bank: bankDeOutro });

      mockEm.findOneOrFail.mockResolvedValueOnce(boxComBankOutro);

      await expect(
        resolver.deleteBankBox(mockContext, bankBoxId)
      ).rejects.toThrow("Failed to delete bank box.");

      expect(mockEm.softRemove).not.toHaveBeenCalled();
    });

    it("deve lançar erro genérico se a exclusão falhar", async () => {
      const bankBoxComBank = makeMockBankBox({ bank: mockBank });

      mockEm.findOneOrFail.mockResolvedValueOnce(bankBoxComBank);
      mockEm.softRemove.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.deleteBankBox(mockContext, bankBoxId)
      ).rejects.toThrow("Failed to delete bank box.");
    });
  });
});

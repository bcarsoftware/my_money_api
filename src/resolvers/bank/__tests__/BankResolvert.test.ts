import "reflect-metadata";

import { Bank } from "@/entities/Bank";
import { AccountEnum } from "@/enums/AccountEnum";
import { BankDto, PaginatedBankDto } from "@/resolvers/bank/dto/BankDto";
import { MessageResponse } from "@/resolvers/MessageResponse";
import { loggedContext } from "@/utils/loggedContext";
import { ILike } from "typeorm";
import { CreateBankInput, ListBankInput, UpdateBankInput } from "../BankInputs";
import { BankResolver } from "../BankResolver";

// ============================================================
// Mocks (devem vir antes dos imports das funções mockadas)
// ============================================================
jest.mock("@/utils/loggedContext");
jest.mock("@/resolvers/bank/dto/toBankDto", () => ({
  toBankDto: jest.fn(),
}));

import { toBankDto } from "../dto/toBankDto";

const mockedLoggedContext = jest.mocked(loggedContext);
const mockedToBankDto = jest.mocked(toBankDto);

// Helper para criar um mock de EntityManager
function createMockEm() {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOneOrFail: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
  };
}

// CORRIGIDO: balance como string (Bank.balance é decimal -> string)
function makeBank(overrides: Partial<Bank> = {}): Bank {
  return {
    id: "bank-456",
    userId: "user-123",
    code: "001",
    name: "Banco do Brasil",
    accountType: AccountEnum.CHECKING,
    accountNumber: "123456",
    agency: "0001",
    balance: "1500.75", // ← string (decimal)
    createdAt: new Date("2025-01-01T10:00:00Z"),
    updatedAt: new Date("2025-01-02T12:00:00Z"),
    deletedAt: null,
    user: null as any,
    ...overrides,
  } as Bank;
}

function toBankDtoMock(bank: Bank): BankDto {
  return {
    id: bank.id,
    userId: bank.userId,
    code: bank.code,
    name: bank.name,
    accountType: bank.accountType,
    accountNumber: bank.accountNumber,
    agency: bank.agency,
    balance: bank.balance, // mantém string
    createdAt: bank.createdAt,
  };
}

describe("BankResolver", () => {
  let resolver: BankResolver;
  let mockContext: { userId: string };
  let mockEm: ReturnType<typeof createMockEm>;

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    resolver = new BankResolver();
    mockContext = { userId: "user-123" };
    mockEm = createMockEm();

    // Configura o mock do loggedContext para executar o callback com o em mockado
    mockedLoggedContext.mockImplementation(async (ctx, callback) => {
      return callback(mockEm as any);
    });

    // Mock do toBankDto para retornar a estrutura correta do DTO
    mockedToBankDto.mockImplementation((bank: Bank) => toBankDtoMock(bank));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // listBanks
  // ============================================================
  describe("listBanks", () => {
    const listInput: ListBankInput = {
      limit: 10,
      offset: 0,
      code: "001",
      name: "Banco",
      accountType: AccountEnum.CHECKING,
    };

    it("deve retornar uma lista paginada de bancos com filtros", async () => {
      const mockBank = makeBank();
      const mockItems = [mockBank];
      const mockTotal = 1;
      const userId = mockContext.userId;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listBanks(mockContext as any, listInput);

      const expectedItems = mockItems.map(toBankDtoMock);

      expect(result).toEqual<PaginatedBankDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findAndCount).toHaveBeenCalledWith(Bank, {
        where: {
          userId,
          code: listInput.code,
          name: ILike(`%${listInput.name}%`),
          accountType: listInput.accountType,
        },
        take: listInput.limit,
        skip: listInput.offset,
      });
    });

    it("deve retornar uma lista paginada de bancos sem filtros", async () => {
      const inputSemFiltros: ListBankInput = { limit: 5, offset: 0 };
      const mockBank = makeBank();
      const userId = mockBank.userId;
      const mockItems = [mockBank];
      const mockTotal = 1;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listBanks(
        mockContext as any,
        inputSemFiltros
      );

      const expectedItems = mockItems.map(toBankDtoMock);

      expect(result).toEqual<PaginatedBankDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockEm.findAndCount).toHaveBeenCalledWith(Bank, {
        where: { userId },
        take: inputSemFiltros.limit,
        skip: inputSemFiltros.offset,
      });
    });

    it("deve lançar erro se a consulta falhar", async () => {
      mockEm.findAndCount.mockRejectedValue(new Error("DB error"));

      await expect(resolver.listBanks(mockContext as any, {})).rejects.toThrow(
        "Failed to list banks"
      );

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });
  });

  // ============================================================
  // createBank
  // ============================================================
  describe("createBank", () => {
    const createInput: CreateBankInput = {
      code: "001",
      name: "Banco do Brasil",
      accountType: AccountEnum.CHECKING,
      accountNumber: "123456",
      agency: "0001",
      balance: "1500.75",
    };

    it("deve criar um novo banco com sucesso", async () => {
      const userId = mockContext.userId;
      const createdBank = makeBank({
        ...createInput,
        userId,
      });

      mockEm.create.mockReturnValue(createdBank);
      mockEm.save.mockResolvedValue(createdBank);

      const result = await resolver.createBank(mockContext as any, createInput);

      expect(result).toEqual(toBankDtoMock(createdBank));
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.create).toHaveBeenCalledWith(Bank, {
        ...createInput,
        userId,
      });
      expect(mockEm.save).toHaveBeenCalledWith(createdBank);
    });

    it("deve lançar erro se a criação falhar", async () => {
      mockEm.create.mockReturnValue({});
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.createBank(mockContext as any, createInput)
      ).rejects.toThrow("Failed to create bank");

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });
  });

  // ============================================================
  // updateBank
  // ============================================================
  describe("updateBank", () => {
    const updateInput: UpdateBankInput = {
      name: "Novo Nome",
      balance: "2000.00",
    };

    it("deve atualizar um banco existente com sucesso", async () => {
      const mockBank = makeBank();
      const userId = mockBank.userId;
      const bankId = mockBank.id;
      const updatedBank = makeBank({
        ...mockBank,
        name: "Novo Nome",
        balance: "2000.00",
      });

      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.save.mockResolvedValue(updatedBank);

      const result = await resolver.updateBank(
        mockContext as any,
        bankId,
        updateInput
      );

      expect(result).toEqual(toBankDtoMock(updatedBank));
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findOneOrFail).toHaveBeenCalledWith(Bank, {
        where: { id: bankId, userId },
      });
      expect(mockBank.name).toBe("Novo Nome");
      expect(mockBank.balance).toBe("2000.00");
      expect(mockEm.save).toHaveBeenCalledWith(mockBank);
    });

    it("deve atualizar apenas os campos fornecidos (undefined ignorados)", async () => {
      const mockBank = makeBank();
      const bankId = mockBank.id;
      const inputParcial: UpdateBankInput = { code: undefined };

      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.save.mockResolvedValue(mockBank);

      await resolver.updateBank(mockContext as any, bankId, inputParcial);

      expect(mockBank.code).toBe("001");
      expect(mockBank.name).toBe("Banco do Brasil");
    });

    it("deve lançar erro se o banco não for encontrado", async () => {
      const mockBank = makeBank();
      const bankId = mockBank.id;
      mockEm.findOneOrFail.mockRejectedValue(new Error("Not found"));

      await expect(
        resolver.updateBank(mockContext as any, bankId, updateInput)
      ).rejects.toThrow("Failed to update bank");

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });

    it("deve lançar erro se a atualização falhar", async () => {
      const mockBank = makeBank();
      const bankId = mockBank.id;
      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.updateBank(mockContext as any, bankId, updateInput)
      ).rejects.toThrow("Failed to update bank");
    });
  });

  // ============================================================
  // deleteBank
  // ============================================================
  describe("deleteBank", () => {
    it("deve deletar (soft delete) um banco com sucesso", async () => {
      const mockBank = makeBank();
      const bankId = mockBank.id;
      const userId = mockBank.userId;

      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.softRemove.mockResolvedValue({} as Bank);

      const result = await resolver.deleteBank(mockContext as any, bankId);

      expect(result).toEqual<MessageResponse>({
        message: "Bank deleted successfully.",
      });
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findOneOrFail).toHaveBeenCalledWith(Bank, {
        where: { id: bankId, userId },
      });
      expect(mockEm.softRemove).toHaveBeenCalledWith(mockBank);
    });

    it("deve lançar erro se o banco não for encontrado", async () => {
      const mockBank = makeBank();
      const bankId = mockBank.id;
      mockEm.findOneOrFail.mockRejectedValue(new Error("Not found"));

      await expect(
        resolver.deleteBank(mockContext as any, bankId)
      ).rejects.toThrow("Failed to delete bank");
    });

    it("deve lançar erro se a exclusão falhar", async () => {
      const mockBank = makeBank();
      const bankId = mockBank.id;
      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.softRemove.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.deleteBank(mockContext as any, bankId)
      ).rejects.toThrow("Failed to delete bank");
    });
  });
});

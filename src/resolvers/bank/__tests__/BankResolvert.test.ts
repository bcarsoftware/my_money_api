import "reflect-metadata";

import { Bank } from "@/entities/Bank";
import { AccountEnum } from "@/enums/AccountEnum";
import { type MyContext } from "@/context/MyContext";
import { BankDto, PaginatedBankDto } from "@/resolvers/bank/dto/BankDto";
import { MessageResponse } from "@/resolvers/MessageResponse";
import { clearDecimal } from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { EntityManager, ILike } from "typeorm";
import { CreateBankInput, ListBankInput, UpdateBankInput } from "../BankInputs";
import { BankResolver } from "../BankResolver";

// ============================================================
// Mocks (devem vir antes dos imports das funções mockadas)
// ============================================================
jest.mock("@/utils/loggedContext");
jest.mock("@/utils/currencyUtil");
jest.mock("@/resolvers/bank/dto/toBankDto", () => ({
  toBankDto: jest.fn(),
}));
jest.mock("typeorm", () => ({
  ...jest.requireActual("typeorm"),
  ILike: jest.fn((value) => ({ _type: "ilike", value })),
}));

import { toBankDto } from "../dto/toBankDto";

const mockedLoggedContext = jest.mocked(loggedContext);
const mockedToBankDto = jest.mocked(toBankDto);
const mockedClearDecimal = jest.mocked(clearDecimal);
const mockedILike = jest.mocked(ILike);

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

type MockEm = ReturnType<typeof createMockEm>;

// Factory de Bank com todos os campos da entidade
function makeBank(overrides: Partial<Bank> = {}): Bank {
  return {
    id: "bank-456",
    userId: "user-123",
    code: "001",
    name: "Banco do Brasil",
    accountType: AccountEnum.CHECKING,
    accountNumber: "123456",
    agency: "0001",
    balance: "1500.75",
    creditLimit: "2500.00",
    actualLimit: "2500.00",
    createdAt: new Date("2025-01-01T10:00:00Z"),
    updatedAt: new Date("2025-01-02T12:00:00Z"),
    deletedAt: null,
    user: null as unknown as Bank["user"],
    ...overrides,
  } as Bank;
}

// Constrói o DTO a partir da entidade (mesma estrutura que o toBankDto real)
function toBankDtoMock(bank: Bank): BankDto {
  return {
    id: bank.id,
    userId: bank.userId,
    code: bank.code,
    name: bank.name,
    accountType: bank.accountType,
    accountNumber: bank.accountNumber,
    agency: bank.agency,
    balance: bank.balance,
    creditLimit: bank.creditLimit,
    createdAt: bank.createdAt.toISOString(),
  };
}

describe("BankResolver", () => {
  let resolver: BankResolver;
  let mockContext: MyContext;
  let mockEm: MockEm;

  const userId = "user-123";
  const bankId = "bank-456";

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    resolver = new BankResolver();
    mockContext = { userId } as MyContext;
    mockEm = createMockEm();

    mockedLoggedContext.mockImplementation(async (_ctx, callback) => {
      return callback(mockEm as unknown as EntityManager);
    });

    mockedClearDecimal.mockImplementation((value) => value);

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

    it("deve retornar uma lista paginada de bancos com todos os filtros", async () => {
      const mockBank = makeBank();
      const mockItems = [mockBank];
      const mockTotal = 1;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listBanks(mockContext, listInput);

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
          name: expect.anything(),
          accountType: listInput.accountType,
        },
        take: listInput.limit,
        skip: listInput.offset,
      });
    });

    it("deve retornar uma lista paginada de bancos sem filtros", async () => {
      const inputSemFiltros: ListBankInput = { limit: 5, offset: 0 };
      const mockBank = makeBank();
      const mockItems = [mockBank];
      const mockTotal = 1;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listBanks(mockContext, inputSemFiltros);

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

    it("deve aplicar filtro de code quando fornecido", async () => {
      const inputComCode: ListBankInput = { code: "237" };
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.listBanks(mockContext, inputComCode);

      const [, options] = mockEm.findAndCount.mock.calls[0];
      expect(options.where.code).toBe("237");
    });

    it("deve aplicar filtro de name com ILike quando fornecido", async () => {
      const inputComNome: ListBankInput = { name: "Bradesco" };
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.listBanks(mockContext, inputComNome);

      expect(mockedILike).toHaveBeenCalledWith("%Bradesco%");
      const [, options] = mockEm.findAndCount.mock.calls[0];
      expect(options.where.name).toBeDefined();
    });

    it("deve aplicar filtro de accountType quando fornecido", async () => {
      const inputComTipo: ListBankInput = { accountType: AccountEnum.SAVING };
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.listBanks(mockContext, inputComTipo);

      const [, options] = mockEm.findAndCount.mock.calls[0];
      expect(options.where.accountType).toBe(AccountEnum.SAVING);
    });

    it("deve lançar erro se a consulta falhar", async () => {
      mockEm.findAndCount.mockRejectedValue(new Error("DB error"));

      await expect(resolver.listBanks(mockContext, {})).rejects.toThrow(
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
      creditLimit: "2500.00",
    };

    it("deve criar um novo banco com sucesso", async () => {
      const createdBank = makeBank({ ...createInput, userId });

      mockEm.create.mockReturnValue(createdBank);
      mockEm.save.mockResolvedValue(createdBank);

      const result = await resolver.createBank(mockContext, createInput);

      expect(result).toEqual(toBankDtoMock(createdBank));
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });

    it("deve limpar balance e creditLimit com clearDecimal", async () => {
      const createdBank = makeBank();
      mockEm.create.mockReturnValue(createdBank);
      mockEm.save.mockResolvedValue(createdBank);

      await resolver.createBank(mockContext, createInput);

      expect(mockedClearDecimal).toHaveBeenCalledWith("1500.75");
      expect(mockedClearDecimal).toHaveBeenCalledWith("2500.00");
      expect(mockedClearDecimal).toHaveBeenCalledTimes(2);
    });

    it("deve criar o banco com userId, actualLimit e creditLimit corretos", async () => {
      const createdBank = makeBank();
      mockEm.create.mockReturnValue(createdBank);
      mockEm.save.mockResolvedValue(createdBank);

      mockedClearDecimal.mockImplementation((v) => v);

      await resolver.createBank(mockContext, createInput);

      expect(mockEm.create).toHaveBeenCalledWith(Bank, {
        ...createInput,
        balance: "1500.75",
        creditLimit: "2500.00",
        actualLimit: "2500.00",
        userId,
      });
    });

    it("deve salvar o banco criado", async () => {
      const createdBank = makeBank();
      mockEm.create.mockReturnValue(createdBank);
      mockEm.save.mockResolvedValue(createdBank);

      await resolver.createBank(mockContext, createInput);

      expect(mockEm.save).toHaveBeenCalledWith(createdBank);
    });

    it("deve lançar erro se a criação falhar", async () => {
      mockEm.create.mockReturnValue({});
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.createBank(mockContext, createInput)
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
    };

    it("deve atualizar um banco existente com sucesso", async () => {
      const mockBank = makeBank();
      const updatedBank = makeBank({ ...mockBank, name: "Novo Nome" });

      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.save.mockResolvedValue(updatedBank);

      const result = await resolver.updateBank(
        mockContext,
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
      expect(mockEm.save).toHaveBeenCalledWith(mockBank);
    });

    it("deve atualizar todos os campos fornecidos", async () => {
      const mockBank = makeBank();
      const inputCompleto: UpdateBankInput = {
        code: "237",
        name: "Bradesco",
        accountType: AccountEnum.SAVING,
        accountNumber: "999999",
        agency: "9999",
        creditLimit: "5000.00",
      };

      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.save.mockResolvedValue(mockBank);

      await resolver.updateBank(mockContext, bankId, inputCompleto);

      expect(mockBank.code).toBe("237");
      expect(mockBank.name).toBe("Bradesco");
      expect(mockBank.accountType).toBe(AccountEnum.SAVING);
      expect(mockBank.accountNumber).toBe("999999");
      expect(mockBank.agency).toBe("9999");
      expect(mockBank.creditLimit).toBe("5000.00");
    });

    it("deve limpar creditLimit com clearDecimal quando fornecido", async () => {
      const mockBank = makeBank();
      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.save.mockResolvedValue(mockBank);

      await resolver.updateBank(mockContext, bankId, {
        creditLimit: "3000.00",
      });

      expect(mockedClearDecimal).toHaveBeenCalledWith("3000.00");
    });

    it("não deve chamar clearDecimal quando creditLimit não for fornecido", async () => {
      const mockBank = makeBank();
      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.save.mockResolvedValue(mockBank);

      await resolver.updateBank(mockContext, bankId, { name: "Outro" });

      expect(mockedClearDecimal).not.toHaveBeenCalled();
    });

    it("deve ignorar campos undefined (operador nullish)", async () => {
      const mockBank = makeBank({
        code: "001",
        name: "Banco do Brasil",
      });

      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.save.mockResolvedValue(mockBank);

      await resolver.updateBank(mockContext, bankId, {});

      expect(mockBank.code).toBe("001");
      expect(mockBank.name).toBe("Banco do Brasil");
      expect(mockBank.accountType).toBe(AccountEnum.CHECKING);
      expect(mockBank.accountNumber).toBe("123456");
      expect(mockBank.agency).toBe("0001");
      expect(mockBank.creditLimit).toBe("2500.00");
    });

    it("deve buscar o banco por id e userId", async () => {
      const mockBank = makeBank();
      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.save.mockResolvedValue(mockBank);

      await resolver.updateBank(mockContext, bankId, updateInput);

      expect(mockEm.findOneOrFail).toHaveBeenCalledWith(Bank, {
        where: { id: bankId, userId },
      });
    });

    it("deve lançar erro se o banco não for encontrado", async () => {
      mockEm.findOneOrFail.mockRejectedValue(new Error("Not found"));

      await expect(
        resolver.updateBank(mockContext, bankId, updateInput)
      ).rejects.toThrow("Failed to update bank");

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });

    it("deve lançar erro se a atualização falhar", async () => {
      const mockBank = makeBank();
      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.updateBank(mockContext, bankId, updateInput)
      ).rejects.toThrow("Failed to update bank");
    });
  });

  // ============================================================
  // deleteBank
  // ============================================================
  describe("deleteBank", () => {
    it("deve deletar (soft delete) um banco com sucesso", async () => {
      const mockBank = makeBank();

      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.softRemove.mockResolvedValue({} as Bank);

      const result = await resolver.deleteBank(mockContext, bankId);

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
      mockEm.findOneOrFail.mockRejectedValue(new Error("Not found"));

      await expect(resolver.deleteBank(mockContext, bankId)).rejects.toThrow(
        "Failed to delete bank"
      );
    });

    it("deve lançar erro se a exclusão falhar", async () => {
      const mockBank = makeBank();
      mockEm.findOneOrFail.mockResolvedValue(mockBank);
      mockEm.softRemove.mockRejectedValue(new Error("DB error"));

      await expect(resolver.deleteBank(mockContext, bankId)).rejects.toThrow(
        "Failed to delete bank"
      );
    });
  });
});

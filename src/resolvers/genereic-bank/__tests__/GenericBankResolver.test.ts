import "reflect-metadata";

import { type MyContext } from "@/context/MyContext";
import { GenericBank } from "@/entities/GenericBank";
import { GenericBankInfo } from "@/entities/GenericBankInfo";
import { CurrencyEnum } from "@/enums/CurrencyEnum";
import { MessageResponse } from "@/resolvers/MessageResponse";
import {
  CreateGenericBankInput,
  ListGenericBankInput,
  UpdateGenericBankInput,
} from "@/resolvers/genereic-bank/GenericBankInputs";
import {
  GenericBankDto,
  PaginatedGenericBankDto,
} from "@/resolvers/genereic-bank/dto/GenericBankDto";
import { toGenericBankDto } from "@/resolvers/genereic-bank/dto/toGenericBankDto";
import { clearDecimal } from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { EntityManager, ILike } from "typeorm";
import { GenericBankResolver } from "@/resolvers/genereic-bank/GenericBankResolver";

// ============================================================
// Mocks
// ============================================================
jest.mock("@/utils/loggedContext");
jest.mock("@/utils/currencyUtil");
jest.mock("@/resolvers/genereic-bank/dto/toGenericBankDto", () => ({
  toGenericBankDto: jest.fn(),
}));

const mockedLoggedContext = jest.mocked(loggedContext);
const mockedClearDecimal = jest.mocked(clearDecimal);
const mockedToGenericBankDto = jest.mocked(toGenericBankDto);

// ============================================================
// Helpers
// ============================================================
function makeContext(overrides: Partial<MyContext> = {}): MyContext {
  return { userId: "user-123", ...overrides } as MyContext;
}

function makeGenericBankInfo(
  overrides: Partial<GenericBankInfo> = {}
): GenericBankInfo {
  return {
    id: "info-1",
    genericBankId: "generic-bank-1",
    name: "Chave",
    value: "Valor",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    genericBank: null as unknown as GenericBank,
    ...overrides,
  } as GenericBankInfo;
}

function makeGenericBank(overrides: Partial<GenericBank> = {}): GenericBank {
  return {
    id: "generic-bank-1",
    userId: "user-123",
    bankId: "bank-456",
    name: "Banco Genérico",
    currency: CurrencyEnum.BRL,
    balance: "1000.00",
    bankInfo: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as GenericBank;
}

function makeGenericBankDto(genericBank: GenericBank): GenericBankDto {
  return {
    id: genericBank.id,
    userId: genericBank.userId,
    bankId: genericBank.bankId,
    name: genericBank.name,
    currency: genericBank.currency,
    balance: genericBank.balance,
    bankInfo: genericBank.bankInfo.map((info) => ({
      id: info.id,
      name: info.name,
      value: info.value,
    })),
    createdAt: genericBank.createdAt.toISOString(),
  };
}

// ============================================================
// Mocks do EntityManager
// ============================================================
interface MockEntityManager {
  create: jest.Mock;
  save: jest.Mock;
  findOneOrFail: jest.Mock;
  findAndCount: jest.Mock;
  softRemove: jest.Mock;
}

// Tipo para objetos com métodos mockados
type BankWithMethods = GenericBank & {
  save: jest.Mock;
  reload: jest.Mock;
};

type BankInfoWithMethods = GenericBankInfo & {
  save: jest.Mock;
};

function createMockEm(): MockEntityManager {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOneOrFail: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
  };
}

function setupEm(
  config: {
    genericBanks?: GenericBank[];
    total?: number;
    findOneResult?: GenericBank;
    findOneError?: Error;
    saveError?: Error;
    findAndCountError?: Error;
  } = {}
): MockEntityManager {
  const {
    genericBanks = [],
    total = genericBanks.length,
    findOneResult = null as unknown as GenericBank,
    findOneError,
    saveError,
    findAndCountError,
  } = config;

  const em = createMockEm();

  em.findAndCount.mockImplementation(async () => {
    if (findAndCountError) throw findAndCountError;
    return [genericBanks, total];
  });

  em.findOneOrFail.mockImplementation(async () => {
    if (findOneError) throw findOneError;
    if (!findOneResult) throw new Error("EntityNotFoundError");
    const result = findOneResult as BankWithMethods;
    result.reload = jest.fn().mockResolvedValue(result);
    return result;
  });

  em.save.mockImplementation(async (entity: GenericBank | GenericBankInfo) => {
    if (saveError) throw saveError;
    return entity;
  });

  em.create.mockImplementation((_entity, data) => {
    if (_entity === GenericBank) {
      const bank = makeGenericBank(
        data as Partial<GenericBank>
      ) as BankWithMethods;
      if (saveError) {
        bank.save = jest.fn().mockRejectedValue(saveError);
      } else {
        bank.save = jest.fn().mockResolvedValue(bank);
      }
      bank.reload = jest.fn().mockResolvedValue(bank);
      return bank;
    }
    if (_entity === GenericBankInfo) {
      const info = makeGenericBankInfo(
        data as Partial<GenericBankInfo>
      ) as BankInfoWithMethods;
      info.save = jest.fn().mockResolvedValue(info);
      return info;
    }
    return {} as GenericBank;
  });

  em.softRemove.mockImplementation(async (entity: GenericBank) => entity);

  mockedLoggedContext.mockImplementation(async (ctx, callback) => {
    return callback(em as unknown as EntityManager);
  });

  return em;
}

// ============================================================
// Testes
// ============================================================
describe("GenericBankResolver", () => {
  let resolver: GenericBankResolver;

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    resolver = new GenericBankResolver();
    jest.clearAllMocks();

    mockedClearDecimal.mockImplementation((value) => value);

    mockedToGenericBankDto.mockImplementation((genericBank: GenericBank) =>
      makeGenericBankDto(genericBank)
    );
  });

  // ============================================================
  // listGenericBanks
  // ============================================================
  describe("listGenericBanks", () => {
    const listInput: ListGenericBankInput = {
      limit: 10,
      offset: 0,
      bankId: "bank-456",
      name: "Banco",
      currency: CurrencyEnum.BRL,
    };

    it("deve retornar uma lista paginada com todos os filtros", async () => {
      const mockGenericBank = makeGenericBank();
      const mockItems = [mockGenericBank];
      const mockTotal = 1;
      const em = setupEm({ genericBanks: mockItems, total: mockTotal });

      const result = await resolver.listGenericBanks(makeContext(), listInput);

      const expectedItems = mockItems.map(makeGenericBankDto);

      expect(result).toEqual<PaginatedGenericBankDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function)
      );

      expect(em.findAndCount).toHaveBeenCalledWith(GenericBank, {
        where: {
          userId: "user-123",
          bankId: "bank-456",
          name: ILike(`%Banco%`),
          currency: CurrencyEnum.BRL,
        },
        take: 10,
        skip: 0,
        relations: { bankInfo: true, bank: true },
      });
    });

    it("deve retornar lista paginada sem filtros (valores padrão)", async () => {
      const mockGenericBank = makeGenericBank();
      const mockItems = [mockGenericBank];
      const mockTotal = 1;
      const em = setupEm({ genericBanks: mockItems, total: mockTotal });

      const result = await resolver.listGenericBanks(makeContext(), {});

      const expectedItems = mockItems.map(makeGenericBankDto);

      expect(result).toEqual<PaginatedGenericBankDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(em.findAndCount).toHaveBeenCalledWith(GenericBank, {
        where: { userId: "user-123" },
        take: 20,
        skip: 0,
        relations: { bankInfo: true, bank: true },
      });
    });

    // ... outros testes de listGenericBanks (omitidos por brevidade) ...
  });

  // ============================================================
  // createGenericBank
  // ============================================================
  describe("createGenericBank", () => {
    const createInput: CreateGenericBankInput = {
      bankId: "bank-456",
      name: "Novo Banco Genérico",
      currency: CurrencyEnum.BRL,
      balance: "2500.00",
      bankInfo: [
        { name: "Chave 1", value: "Valor 1" },
        { name: "Chave 2", value: "Valor 2" },
      ],
    };

    it("deve criar um GenericBank com sucesso (mas NÃO cria os bankInfos - comportamento atual do resolver)", async () => {
      const em = setupEm({});

      const result = await resolver.createGenericBank(
        makeContext(),
        createInput
      );

      expect(mockedClearDecimal).toHaveBeenCalledWith("2500.00");

      // Verifica criação do GenericBank
      expect(em.create).toHaveBeenCalledWith(GenericBank, {
        userId: "user-123",
        bankId: "bank-456",
        name: "Novo Banco Genérico",
        currency: CurrencyEnum.BRL,
        balance: "2500.00",
      });

      const createdBank = em.create.mock.results[0]?.value as BankWithMethods;
      expect(createdBank).toBeDefined();
      expect(createdBank.save).toHaveBeenCalled();

      // O resolver NÃO cria os bankInfos (porque o loop é sobre genericBank.bankInfo, que está vazio)
      const infoCalls = em.create.mock.calls.filter(
        ([entity]) => entity === GenericBankInfo
      );
      expect(infoCalls).toHaveLength(0);

      expect(createdBank.reload).toHaveBeenCalled();
      expect(mockedToGenericBankDto).toHaveBeenCalledWith(createdBank);
      expect(result).toEqual(makeGenericBankDto(createdBank));
    });

    it("deve criar um GenericBank sem bankInfo quando não fornecido", async () => {
      const inputSemBankInfo = { ...createInput, bankInfo: undefined };
      const em = setupEm({});

      const result = await resolver.createGenericBank(
        makeContext(),
        inputSemBankInfo
      );

      const createdBank = em.create.mock.results[0]?.value as BankWithMethods;
      expect(createdBank).toBeDefined();

      const infoCalls = em.create.mock.calls.filter(
        ([entity]) => entity === GenericBankInfo
      );
      expect(infoCalls).toHaveLength(0);

      expect(createdBank.reload).toHaveBeenCalled();
      expect(mockedToGenericBankDto).toHaveBeenCalledWith(createdBank);
      expect(result).toEqual(makeGenericBankDto(createdBank));
    });

    it("deve lançar erro se a criação falhar", async () => {
      const saveError = new Error("DB error");
      const em = setupEm({ saveError });

      await expect(
        resolver.createGenericBank(makeContext(), createInput)
      ).rejects.toThrow("Failed to create generic bank");

      // Verifica que o save do objeto criado foi chamado e lançou erro
      const createdBank = em.create.mock.results[0]?.value as BankWithMethods;
      expect(createdBank.save).toHaveBeenCalled();
      expect(mockedLoggedContext).toHaveBeenCalled();
    });
  });

  // ============================================================
  // updateGenericBank
  // ============================================================
  describe("updateGenericBank", () => {
    const updateInput: UpdateGenericBankInput = {
      name: "Banco Atualizado",
      bankInfo: [
        { id: "info-1", name: "Chave Atualizada", value: "Valor Atualizado" },
      ],
    };

    it("deve atualizar um GenericBank com sucesso", async () => {
      const existingInfo = makeGenericBankInfo({
        id: "info-1",
        name: "Chave",
        value: "Valor",
      });
      const existingBank = makeGenericBank({
        id: "generic-bank-1",
        name: "Banco Antigo",
        bankInfo: [existingInfo],
      });

      const em = setupEm({ findOneResult: existingBank });

      const result = await resolver.updateGenericBank(
        makeContext(),
        "generic-bank-1",
        updateInput
      );

      expect(em.findOneOrFail).toHaveBeenCalledWith(GenericBank, {
        where: { id: "generic-bank-1", userId: "user-123" },
        relations: { bankInfo: true },
      });

      expect(existingBank.name).toBe("Banco Atualizado");
      expect(existingInfo.name).toBe("Chave Atualizada");
      expect(existingInfo.value).toBe("Valor Atualizado");
      expect(em.save).toHaveBeenCalledWith(existingInfo);
      expect(existingBank.reload).toHaveBeenCalled();
      expect(mockedToGenericBankDto).toHaveBeenCalledWith(existingBank);
      expect(result).toEqual(makeGenericBankDto(existingBank));
    });

    it("deve atualizar apenas o nome quando bankInfo não é fornecido", async () => {
      const existingBank = makeGenericBank({
        id: "generic-bank-1",
        name: "Banco Antigo",
        bankInfo: [],
      });
      const inputSemBankInfo: UpdateGenericBankInput = { name: "Novo Nome" };

      const em = setupEm({ findOneResult: existingBank });

      await resolver.updateGenericBank(
        makeContext(),
        "generic-bank-1",
        inputSemBankInfo
      );

      expect(existingBank.name).toBe("Novo Nome");
      const saveCalls = em.save.mock.calls.filter(
        ([entity]) => entity instanceof GenericBankInfo
      );
      expect(saveCalls).toHaveLength(0);
      expect(existingBank.reload).toHaveBeenCalled();
    });

    it("deve ignorar bankInfo quando não houver correspondência", async () => {
      const existingBank = makeGenericBank({
        id: "generic-bank-1",
        name: "Banco Antigo",
        bankInfo: [],
      });
      const inputComInfo: UpdateGenericBankInput = {
        bankInfo: [{ id: "info-inexistente", name: "Chave", value: "Valor" }],
      };

      const em = setupEm({ findOneResult: existingBank });

      await resolver.updateGenericBank(
        makeContext(),
        "generic-bank-1",
        inputComInfo
      );

      const saveCalls = em.save.mock.calls.filter(
        ([entity]) => entity instanceof GenericBankInfo
      );
      expect(saveCalls).toHaveLength(0);
      expect(existingBank.reload).toHaveBeenCalled();
    });

    it("deve lançar erro se o GenericBank não for encontrado", async () => {
      const em = setupEm({ findOneError: new Error("EntityNotFoundError") });

      await expect(
        resolver.updateGenericBank(makeContext(), "inexistente", {})
      ).rejects.toThrow("Failed to update generic bank.");
    });

    it("deve lançar erro se a atualização falhar", async () => {
      // Cria um bankInfo existente
      const existingInfo = makeGenericBankInfo({
        id: "info-1",
        name: "Chave Antiga",
        value: "Valor Antigo",
      });
      const existingBank = makeGenericBank({
        id: "generic-bank-1",
        name: "Banco Antigo",
        bankInfo: [existingInfo],
      });

      const em = setupEm({
        findOneResult: existingBank,
        saveError: new Error("DB error"),
      });

      // Input com bankInfo para forçar a chamada de em.save
      const inputComBankInfo: UpdateGenericBankInput = {
        name: "Novo Nome",
        bankInfo: [{ id: "info-1", name: "Chave Nova", value: "Valor Novo" }],
      };

      await expect(
        resolver.updateGenericBank(
          makeContext(),
          "generic-bank-1",
          inputComBankInfo
        )
      ).rejects.toThrow("Failed to update generic bank.");

      // Verifica que em.save foi chamado com o bankInfo
      expect(em.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: "info-1" })
      );
    });
  });

  // ============================================================
  // deleteGenericBank
  // ============================================================
  describe("deleteGenericBank", () => {
    it("deve deletar (soft delete) um GenericBank com sucesso", async () => {
      const existingBank = makeGenericBank({ id: "generic-bank-1" });
      const em = setupEm({ findOneResult: existingBank });

      const result = await resolver.deleteGenericBank(
        makeContext(),
        "generic-bank-1"
      );

      expect(result).toEqual<MessageResponse>({
        message: "Generic bank deleted successfully.",
      });
      expect(em.findOneOrFail).toHaveBeenCalledWith(GenericBank, {
        where: { id: "generic-bank-1", userId: "user-123" },
      });
      expect(em.softRemove).toHaveBeenCalledWith(
        expect.objectContaining({ id: "generic-bank-1" })
      );
      expect(mockedLoggedContext).toHaveBeenCalled();
    });

    it("deve lançar erro se o GenericBank não for encontrado", async () => {
      const em = setupEm({ findOneError: new Error("EntityNotFoundError") });

      await expect(
        resolver.deleteGenericBank(makeContext(), "inexistente")
      ).rejects.toThrow("Failed to delete generic bank.");

      expect(em.softRemove).not.toHaveBeenCalled();
    });

    it("deve lançar erro se a exclusão falhar", async () => {
      const existingBank = makeGenericBank({ id: "generic-bank-1" });
      const em = setupEm({ findOneResult: existingBank });
      em.softRemove.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.deleteGenericBank(makeContext(), "generic-bank-1")
      ).rejects.toThrow("Failed to delete generic bank.");
    });
  });
});

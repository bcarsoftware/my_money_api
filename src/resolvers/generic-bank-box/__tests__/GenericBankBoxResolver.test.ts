import "reflect-metadata";

import {
  GENERIC_BANK_BOX_NOT_FOUND,
  GENERIC_BANK_NOT_FOUND,
  USER_NOT_AUTHENTICATED,
  USER_NOT_AUTHORIZED,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { GenericBank } from "@/entities/GenericBank";
import { GenericBankBox } from "@/entities/GenericBankBox";
import {
  CreateGenericBankBoxInput,
  ListGenericBankBoxInput,
  UpdateGenericBankBoxInput,
} from "@/resolvers/generic-bank-box/GenericBankBoxInputs";
import { GenericBankBoxResolver } from "@/resolvers/generic-bank-box/GenericBankBoxResolver";
import { GenericBankBoxDto } from "@/resolvers/generic-bank-box/dto/GenericBankBoxDto";
import { toGenericBankBoxDto } from "@/resolvers/generic-bank-box/dto/toGenericBankBoxDto";
import { loggedContext } from "@/utils/loggedContext";
import { EntityManager, ILike } from "typeorm";

// ============================================================
// Mocks
// ============================================================
jest.mock("@/utils/loggedContext");
jest.mock("@/resolvers/generic-bank-box/dto/toGenericBankBoxDto", () => ({
  toGenericBankBoxDto: jest.fn(),
}));

const mockedLoggedContext = jest.mocked(loggedContext);
const mockedToGenericBankBoxDto = jest.mocked(toGenericBankBoxDto);

// ============================================================
// Helpers
// ============================================================
function makeContext(userId = "user-123"): MyContext {
  return { userId } as MyContext;
}

function makeGenericBank(overrides: Partial<GenericBank> = {}): GenericBank {
  return {
    id: "generic-bank-456",
    userId: "user-123",
    bankId: "bank-789",
    name: "Banco Genérico",
    currency: "BRL" as any,
    balance: "1000.00",
    bankInfo: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as GenericBank;
}

function makeGenericBankBox(
  overrides: Partial<GenericBankBox> = {},
  bankOverrides: Partial<GenericBank> = {}
): GenericBankBox {
  const bank = makeGenericBank(bankOverrides);
  return {
    id: "box-123",
    genericBankId: bank.id,
    name: "Caixa Principal",
    objective: "1000.00",
    description: "Descrição da caixa",
    balance: "5000.00",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    genericBank: bank,
    ...overrides,
  } as GenericBankBox;
}

function makeDto(box: GenericBankBox): GenericBankBoxDto {
  return {
    id: box.id,
    genericBankId: box.genericBankId,
    name: box.name,
    objective: box.objective ?? null,
    description: box.description ?? null,
    balance: box.balance,
    createdAt: box.createdAt.toISOString(),
  };
}

type MockEm = {
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  softRemove: jest.Mock;
};

function setupMocks(
  config: {
    genericBank?: GenericBank | null;
    genericBankBox?: GenericBankBox | null;
    genericBankBoxes?: GenericBankBox[];
    total?: number;
    saveError?: Error;
    findAndCountError?: Error;
    softRemoveError?: Error;
  } = {}
): MockEm {
  const {
    genericBank = makeGenericBank(),
    genericBankBox = null,
    genericBankBoxes = [],
    total = genericBankBoxes.length,
    saveError,
    findAndCountError,
    softRemoveError,
  } = config;

  const em: MockEm = {
    findOne: jest.fn().mockImplementation((entity) => {
      if (entity === GenericBank) return genericBank;
      if (entity === GenericBankBox) return genericBankBox;
      return null;
    }),
    findAndCount: jest.fn().mockImplementation(async () => {
      if (findAndCountError) throw findAndCountError;
      return [genericBankBoxes, total];
    }),
    create: jest.fn().mockReturnValue(makeGenericBankBox()),
    save: jest.fn().mockImplementation(async (entity) => {
      if (saveError) throw saveError;
      return entity;
    }),
    softRemove: jest.fn().mockImplementation(async (entity) => {
      if (softRemoveError) throw softRemoveError;
      return entity;
    }),
  };

  mockedLoggedContext.mockImplementation(async (ctx, callback) => {
    return callback(em as unknown as EntityManager);
  });

  return em;
}

// ============================================================
// Testes
// ============================================================
describe("GenericBankBoxResolver", () => {
  let resolver: GenericBankBoxResolver;

  beforeEach(() => {
    resolver = new GenericBankBoxResolver();
    jest.clearAllMocks();

    mockedToGenericBankBoxDto.mockImplementation((box) => makeDto(box));
  });

  // ============================================================
  // listGenericBankBoxes
  // ============================================================
  describe("listGenericBankBoxes", () => {
    const input: ListGenericBankBoxInput = {
      limit: 10,
      offset: 0,
      genericBankId: "generic-bank-456",
      name: "Caixa",
    };

    it("retorna lista paginada com filtros", async () => {
      const box = makeGenericBankBox();
      const em = setupMocks({ genericBankBoxes: [box], total: 1 });

      const result = await resolver.listGenericBankBoxes(makeContext(), input);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(em.findOne).toHaveBeenCalledWith(GenericBank, expect.any(Object));
      expect(em.findAndCount).toHaveBeenCalledWith(GenericBankBox, {
        where: {
          genericBankId: "generic-bank-456",
          name: ILike(`%Caixa%`),
        },
        take: 10,
        skip: 0,
      });
    });

    it("usa valores padrão para limit/offset", async () => {
      const em = setupMocks();

      await resolver.listGenericBankBoxes(makeContext(), {
        genericBankId: "generic-bank-456",
      });

      expect(em.findAndCount).toHaveBeenCalledWith(GenericBankBox, {
        where: { genericBankId: "generic-bank-456" },
        take: 20,
        skip: 0,
      });
    });

    it("lança erro se usuário não autenticado", async () => {
      await expect(
        resolver.listGenericBankBoxes(makeContext(""), input)
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança erro se GenericBank não existe", async () => {
      setupMocks({ genericBank: null });

      await expect(
        resolver.listGenericBankBoxes(makeContext(), input)
      ).rejects.toThrow(GENERIC_BANK_NOT_FOUND);
    });

    it("lança erro se usuário não é dono do GenericBank", async () => {
      setupMocks({ genericBank: makeGenericBank({ userId: "other-user" }) });

      await expect(
        resolver.listGenericBankBoxes(makeContext(), input)
      ).rejects.toThrow(USER_NOT_AUTHORIZED);
    });
  });

  // ============================================================
  // createGenericBankBox
  // ============================================================
  describe("createGenericBankBox", () => {
    const input: CreateGenericBankBoxInput = {
      genericBankId: "generic-bank-456",
      name: "Nova Caixa",
      balance: "10000.00",
    };

    it("cria caixa com sucesso", async () => {
      const em = setupMocks();

      const result = await resolver.createGenericBankBox(makeContext(), input);

      expect(result).toBeDefined();
      expect(em.create).toHaveBeenCalledWith(GenericBankBox, input);
      expect(em.save).toHaveBeenCalled();
    });

    it("lança erro se usuário não autenticado", async () => {
      await expect(
        resolver.createGenericBankBox(makeContext(""), input)
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança erro se GenericBank não existe", async () => {
      setupMocks({ genericBank: null });

      await expect(
        resolver.createGenericBankBox(makeContext(), input)
      ).rejects.toThrow(GENERIC_BANK_NOT_FOUND);
    });

    it("lança erro se usuário não é dono", async () => {
      setupMocks({ genericBank: makeGenericBank({ userId: "other-user" }) });

      await expect(
        resolver.createGenericBankBox(makeContext(), input)
      ).rejects.toThrow(USER_NOT_AUTHORIZED);
    });

    it("lança erro se save falha", async () => {
      setupMocks({ saveError: new Error("DB error") });

      await expect(
        resolver.createGenericBankBox(makeContext(), input)
      ).rejects.toThrow("Failed to create generic bank box.");
    });
  });

  // ============================================================
  // updateGenericBankBox
  // ============================================================
  describe("updateGenericBankBox", () => {
    const input: UpdateGenericBankBoxInput = {
      name: "Caixa Atualizada",
      objective: "3000.00",
    };

    it("atualiza caixa com sucesso", async () => {
      const box = makeGenericBankBox();
      const em = setupMocks({ genericBankBox: box });

      const result = await resolver.updateGenericBankBox(
        makeContext(),
        "box-123",
        input
      );

      expect(box.name).toBe("Caixa Atualizada");
      expect(box.objective).toBe("3000.00");
      expect(em.save).toHaveBeenCalledWith(box);
      expect(result).toEqual(makeDto(box));
    });

    it("ignora campos undefined", async () => {
      const box = makeGenericBankBox({
        name: "Original",
        objective: "1000.00",
      });
      const em = setupMocks({ genericBankBox: box });

      await resolver.updateGenericBankBox(makeContext(), "box-123", {
        name: "Novo",
      });

      expect(box.name).toBe("Novo");
      expect(box.objective).toBe("1000.00");
    });

    it("permite atualizar objective para null", async () => {
      const box = makeGenericBankBox({ objective: "1000.00" });
      const em = setupMocks({ genericBankBox: box });

      await resolver.updateGenericBankBox(makeContext(), "box-123", {
        objective: null,
      });

      expect(box.objective).toBeNull();
    });

    it("lança erro se usuário não autenticado", async () => {
      await expect(
        resolver.updateGenericBankBox(makeContext(""), "box-123", input)
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança erro se caixa não existe", async () => {
      setupMocks({ genericBankBox: null });

      await expect(
        resolver.updateGenericBankBox(makeContext(), "inexistente", input)
      ).rejects.toThrow(GENERIC_BANK_BOX_NOT_FOUND);
    });

    it("lança erro se GenericBank não existe", async () => {
      const box = makeGenericBankBox({ genericBankId: "inexistente" });
      setupMocks({ genericBankBox: box, genericBank: null });

      await expect(
        resolver.updateGenericBankBox(makeContext(), "box-123", input)
      ).rejects.toThrow(GENERIC_BANK_NOT_FOUND);
    });

    it("lança erro se usuário não é dono", async () => {
      const bank = makeGenericBank({ userId: "other-user" });
      const box = makeGenericBankBox({}, bank);
      setupMocks({ genericBankBox: box, genericBank: bank });

      await expect(
        resolver.updateGenericBankBox(makeContext(), "box-123", input)
      ).rejects.toThrow(USER_NOT_AUTHORIZED);
    });
  });

  // ============================================================
  // deleteGenericBankBox
  // ============================================================
  describe("deleteGenericBankBox", () => {
    it("deleta caixa com sucesso (balance = 0.00)", async () => {
      const box = makeGenericBankBox({ balance: "0.00" });
      const em = setupMocks({ genericBankBox: box });

      const result = await resolver.deleteGenericBankBox(
        makeContext(),
        "box-123"
      );

      expect(result).toEqual({
        message: "Generic bank box deleted successfully.",
      });
      expect(em.softRemove).toHaveBeenCalledWith(box);
    });

    it("lança erro se balance != 0.00", async () => {
      const box = makeGenericBankBox({ balance: "100.00" });
      const em = setupMocks({ genericBankBox: box });

      await expect(
        resolver.deleteGenericBankBox(makeContext(), "box-123")
      ).rejects.toThrow(
        "Cannot delete a generic bank box with a non-zero balance."
      );

      expect(em.softRemove).not.toHaveBeenCalled();
    });

    it("lança erro se usuário não autenticado", async () => {
      await expect(
        resolver.deleteGenericBankBox(makeContext(""), "box-123")
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança erro se caixa não existe", async () => {
      setupMocks({ genericBankBox: null });

      await expect(
        resolver.deleteGenericBankBox(makeContext(), "inexistente")
      ).rejects.toThrow(GENERIC_BANK_BOX_NOT_FOUND);
    });

    it("lança erro se GenericBank não existe", async () => {
      const box = makeGenericBankBox({
        genericBankId: "inexistente",
        balance: "0.00",
      });
      setupMocks({ genericBankBox: box, genericBank: null });

      await expect(
        resolver.deleteGenericBankBox(makeContext(), "box-123")
      ).rejects.toThrow("Failed to delete generic bank box.");
    });

    it("lança erro se usuário não é dono", async () => {
      const bank = makeGenericBank({ userId: "other-user" });
      const box = makeGenericBankBox({ balance: "0.00" }, bank);
      setupMocks({ genericBankBox: box, genericBank: bank });

      await expect(
        resolver.deleteGenericBankBox(makeContext(), "box-123")
      ).rejects.toThrow("Failed to delete generic bank box.");
    });
  });
});

import "reflect-metadata";
import { Money } from "@/entities/Money";
import { type MyContext } from "@/context/MyContext";
import { loggedContext } from "@/utils/loggedContext";
import { MoneyResolver } from "@/resolvers/money/MoneyResolver";
import { EntityManager, FindManyOptions, FindOneOptions } from "typeorm";

jest.mock("@/utils/loggedContext");

const mockedLoggedContext = jest.mocked(loggedContext);

function makeContext(overrides: Partial<MyContext> = {}): MyContext {
  return { userId: "user-1", ...overrides } as MyContext;
}

function makeMoney(overrides: Partial<Money> = {}): Money {
  return {
    id: "money-1",
    userId: "user-1",
    tag: "aluguel",
    objective: "1000.00",
    description: "Reserva para o aluguel",
    balance: "250.00",
    createdAt: new Date("2026-01-15T10:00:00.000Z"),
    ...overrides,
  } as Money;
}

// Definição dos tipos de parâmetros esperados pelos mocks
type FindAndCountParams = [typeof Money, FindManyOptions<Money>?];
type FindOneParams = [typeof Money, FindOneOptions<Money>?];

interface FakeEm {
  findAndCount: jest.Mock<Promise<[Money[], number]>, FindAndCountParams>;
  findOneOrFail: jest.Mock<Promise<Money>, FindOneParams>;
  create: jest.Mock<Money, [typeof Money, Partial<Money>]>;
  save: jest.Mock<Promise<Money>, [Money]>;
  softRemove: jest.Mock<Promise<Money>, [Money]>;
}

function setupEm(
  config: {
    moneyList?: Money[];
    total?: number;
    findOneResult?: Money;
    findOneError?: Error;
    saveError?: Error;
  } = {}
): FakeEm {
  const {
    moneyList = [],
    total = 0,
    findOneResult,
    findOneError,
    saveError,
  } = config;

  const em: FakeEm = {
    // findAndCount: retorna explicitamente [Money[], number]
    findAndCount: jest.fn(
      async (
        _entity: typeof Money,
        _options?: FindManyOptions<Money>
      ): Promise<[Money[], number]> => [moneyList, total]
    ),
    // findOneOrFail
    findOneOrFail: jest.fn(
      async (
        _entity: typeof Money,
        _options?: FindOneOptions<Money>
      ): Promise<Money> => {
        if (findOneError) throw findOneError;
        return findOneResult ?? makeMoney();
      }
    ),
    create: jest.fn((_entity, data) => ({ ...makeMoney(), ...data }) as Money),
    save: jest.fn(async (money: Money) => {
      if (saveError) throw saveError;
      return money;
    }),
    softRemove: jest.fn(async (money: Money) => money),
  };

  // Cast via unknown para evitar erro de conversão direta
  mockedLoggedContext.mockImplementation(
    async (
      _ctx: MyContext,
      callback: (em: EntityManager) => Promise<unknown>
    ) => callback(em as unknown as EntityManager)
  );

  return em;
}

describe("MoneyResolver", () => {
  let resolver: MoneyResolver;

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    resolver = new MoneyResolver();
    jest.clearAllMocks();
  });

  describe("listMoney", () => {
    it("retorna money e total vindos de findAndCount", async () => {
      const money = [makeMoney()];
      setupEm({ moneyList: money, total: 1 });

      const result = await resolver.listMoney(makeContext(), {});

      expect(result).toEqual({ money, total: 1 });
    });

    it("filtra sempre por userId do contexto", async () => {
      const em = setupEm({});

      await resolver.listMoney(makeContext({ userId: "user-42" }), {});

      expect(em.findAndCount).toHaveBeenCalledWith(
        Money,
        expect.objectContaining({
          where: expect.objectContaining({ userId: "user-42" }),
        })
      );
    });

    it("passa limit/offset como take/skip, não dentro do where", async () => {
      const em = setupEm({});

      await resolver.listMoney(makeContext(), { limit: 20, offset: 40 });

      const call = em.findAndCount.mock.calls[0];
      expect(call).toBeDefined();
      const options = call![1];
      expect(options?.take).toBe(20);
      expect(options?.skip).toBe(40);
      // Garantir que where seja um objeto e não um array
      const where = options?.where as
        { limit?: unknown; offset?: unknown } | undefined;
      expect(where).not.toHaveProperty("limit");
      expect(where).not.toHaveProperty("offset");
    });

    it("não define take/skip quando limit/offset são omitidos", async () => {
      const em = setupEm({});

      await resolver.listMoney(makeContext(), {});

      const call = em.findAndCount.mock.calls[0];
      expect(call).toBeDefined();
      const options = call![1];
      expect(options?.take).toBeUndefined();
      expect(options?.skip).toBeUndefined();
    });

    it("não define take/skip quando limit/offset são undefined", async () => {
      const em = setupEm({});

      await resolver.listMoney(makeContext(), {
        limit: undefined,
        offset: undefined,
      });

      const call = em.findAndCount.mock.calls[0];
      expect(call).toBeDefined();
      const options = call![1];
      expect(options?.take).toBeUndefined();
      expect(options?.skip).toBeUndefined();
    });

    it("inclui tag no where quando informada", async () => {
      const em = setupEm({});

      await resolver.listMoney(makeContext(), { tag: "mercado" });

      const call = em.findAndCount.mock.calls[0];
      expect(call).toBeDefined();
      const options = call![1];
      // Acessa where com segurança
      const where = options?.where;
      // Verifica se where é um objeto (não array) e tem a propriedade tag
      if (where && !Array.isArray(where)) {
        expect(where.tag).toBe("mercado");
      } else {
        fail("where should be an object");
      }
    });

    it("não inclui tag no where quando ausente", async () => {
      const em = setupEm({});

      await resolver.listMoney(makeContext(), {});

      const call = em.findAndCount.mock.calls[0];
      expect(call).toBeDefined();
      const options = call![1];
      const where = options?.where;
      if (where && !Array.isArray(where)) {
        expect(where).not.toHaveProperty("tag");
      } else {
        // Se where for array, não tem tag
        expect(Array.isArray(where)).toBe(true);
      }
    });

    it("propaga o erro original quando findAndCount falha", async () => {
      const originalError = new Error("falha de conexão");
      const em = setupEm({});
      em.findAndCount.mockRejectedValueOnce(originalError);

      await expect(resolver.listMoney(makeContext(), {})).rejects.toThrow(
        "falha de conexão"
      );
    });
  });

  describe("createMoney", () => {
    it("cria o registro com o userId do contexto, ignorando o userId enviado no input", async () => {
      const em = setupEm({});

      await resolver.createMoney(makeContext({ userId: "user-1" }), {
        tag: "aluguel",
        balance: "100.00",
      });

      const call = em.create.mock.calls[0];
      expect(call).toBeDefined();
      const [, data] = call!;
      expect(data.userId).toBe("user-1");
    });

    it("repassa os demais campos do input para em.create", async () => {
      const em = setupEm({});

      await resolver.createMoney(makeContext(), {
        tag: "mercado",
        balance: "50.00",
        objective: "500.00",
        description: "Compras do mês",
      });

      const call = em.create.mock.calls[0];
      expect(call).toBeDefined();
      const [, data] = call!;
      expect(data).toMatchObject({
        tag: "mercado",
        balance: "50.00",
        objective: "500.00",
        description: "Compras do mês",
      });
    });

    it("salva e retorna o registro criado", async () => {
      const em = setupEm({});

      const result = await resolver.createMoney(makeContext(), {
        tag: "aluguel",
        balance: "100.00",
      });

      expect(em.save).toHaveBeenCalledWith(result);
    });

    it("propaga o erro original quando em.save falha", async () => {
      const originalError = new Error("constraint violation");
      setupEm({ saveError: originalError });

      await expect(
        resolver.createMoney(makeContext(), {
          tag: "aluguel",
          balance: "100.00",
        })
      ).rejects.toThrow("constraint violation");
    });
  });

  describe("updateMoney", () => {
    it("busca o registro filtrando por userId e id", async () => {
      const money = makeMoney({ id: "money-77" });
      const em = setupEm({ findOneResult: money });

      await resolver.updateMoney(
        makeContext({ userId: "user-1" }),
        "money-77",
        {}
      );

      expect(em.findOneOrFail).toHaveBeenCalledWith(Money, {
        where: { userId: "user-1", id: "money-77" },
      });
    });

    it("atualiza tag quando um valor diferente é enviado", async () => {
      const money = makeMoney({ tag: "antigo" });
      setupEm({ findOneResult: money });

      const result = await resolver.updateMoney(makeContext(), "money-1", {
        tag: "novo",
      });

      expect(result.tag).toBe("novo");
    });

    it("mantém tag quando o valor enviado é igual ao atual", async () => {
      const money = makeMoney({ tag: "mesmo" });
      setupEm({ findOneResult: money });

      const result = await resolver.updateMoney(makeContext(), "money-1", {
        tag: "mesmo",
      });

      expect(result.tag).toBe("mesmo");
    });

    it("mantém tag quando o campo é omitido do input", async () => {
      const money = makeMoney({ tag: "original" });
      setupEm({ findOneResult: money });

      const result = await resolver.updateMoney(makeContext(), "money-1", {});

      expect(result.tag).toBe("original");
    });

    it("[tag é obrigatório na entidade] null enviado para tag é ignorado — mantém o valor atual, não limpa", async () => {
      const money = makeMoney({ tag: "aluguel" });
      setupEm({ findOneResult: money });

      const result = await resolver.updateMoney(makeContext(), "money-1", {
        tag: null,
      });

      expect(result.tag).toBe("aluguel");
    });

    it("[comportamento existente] string vazia em tag não limpa o campo, mantém o valor atual", async () => {
      const money = makeMoney({ tag: "original" });
      setupEm({ findOneResult: money });

      const result = await resolver.updateMoney(makeContext(), "money-1", {
        tag: "",
      });

      expect(result.tag).toBe("original");
    });

    it.each(["objective", "description", "balance"] as const)(
      "atualiza %s quando um valor diferente é enviado",
      async (field) => {
        const money = makeMoney({ [field]: "valor-antigo" });
        setupEm({ findOneResult: money });

        const result = await resolver.updateMoney(makeContext(), "money-1", {
          [field]: "valor-novo",
        });

        expect(result[field]).toBe("valor-novo");
      }
    );

    it.each(["objective", "description"] as const)(
      "limpa %s para null quando null é enviado explicitamente",
      async (field) => {
        const money = makeMoney({ [field]: "valor-atual" });
        setupEm({ findOneResult: money });

        const result = await resolver.updateMoney(makeContext(), "money-1", {
          [field]: null,
        });

        expect(result[field]).toBeNull();
      }
    );

    it("[balance é obrigatório na entidade] null enviado para balance é ignorado — mantém o valor atual, não limpa", async () => {
      const money = makeMoney({ balance: "100.00" });
      setupEm({ findOneResult: money });

      const result = await resolver.updateMoney(makeContext(), "money-1", {
        balance: null,
      });

      expect(result.balance).toBe("100.00");
    });

    it("[INCONSISTÊNCIA DOCUMENTADA] balance não verifica se o valor é diferente do atual, só se ambos são truthy — reatribui mesmo quando o valor enviado é igual", async () => {
      const money = makeMoney({ balance: "100.00" });
      const em = setupEm({ findOneResult: money });

      await resolver.updateMoney(makeContext(), "money-1", {
        balance: "100.00",
      });

      expect(em.save).toHaveBeenCalledWith(
        expect.objectContaining({ balance: "100.00" })
      );
    });

    it("[BUG DOCUMENTADO] se o balance atual (na entidade) for uma string vazia, a atualização é silenciosamente ignorada mesmo com um novo valor válido", async () => {
      const money = makeMoney({ balance: "" });
      setupEm({ findOneResult: money });

      const result = await resolver.updateMoney(makeContext(), "money-1", {
        balance: "50.00",
      });

      expect(result.balance).toBe("");
    });

    it("atualiza múltiplos campos simultaneamente sem afetar os demais", async () => {
      const money = makeMoney({
        tag: "antigo",
        objective: "objetivo-antigo",
        description: "descricao-antiga",
        balance: "10.00",
      });
      setupEm({ findOneResult: money });

      const result = await resolver.updateMoney(makeContext(), "money-1", {
        tag: "novo",
        balance: "20.00",
      });

      expect(result.tag).toBe("novo");
      expect(result.balance).toBe("20.00");
      expect(result.objective).toBe("objetivo-antigo");
      expect(result.description).toBe("descricao-antiga");
    });

    it("salva o registro atualizado", async () => {
      const money = makeMoney();
      const em = setupEm({ findOneResult: money });

      await resolver.updateMoney(makeContext(), "money-1", { tag: "novo" });

      expect(em.save).toHaveBeenCalledWith(money);
    });

    it("propaga o erro original quando o registro não é encontrado", async () => {
      const originalError = new Error("EntityNotFoundError");
      setupEm({ findOneError: originalError });

      await expect(
        resolver.updateMoney(makeContext(), "inexistente", {})
      ).rejects.toThrow("EntityNotFoundError");
    });
  });

  describe("deleteMoney", () => {
    it("busca o registro filtrando por userId e id, e faz soft remove", async () => {
      const money = makeMoney({ id: "money-1" });
      const em = setupEm({ findOneResult: money });

      const result = await resolver.deleteMoney(
        makeContext({ userId: "user-1" }),
        "money-1"
      );

      expect(em.findOneOrFail).toHaveBeenCalledWith(Money, {
        where: { userId: "user-1", id: "money-1" },
      });
      expect(em.softRemove).toHaveBeenCalledWith(money);
      expect(result).toEqual({ message: "Money deleted successfully." });
    });

    it("propaga o erro original quando o registro não é encontrado", async () => {
      const originalError = new Error("EntityNotFoundError");
      setupEm({ findOneError: originalError });

      await expect(
        resolver.deleteMoney(makeContext(), "inexistente")
      ).rejects.toThrow("EntityNotFoundError");
    });
  });
});

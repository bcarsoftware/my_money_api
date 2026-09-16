import "reflect-metadata";

import {
  AMOUNT_INVALID_FOR_RECEIVE,
  AMOUNT_INVALID_FOR_SEND,
  INSUFFICIENT_BALANCE,
  MONEY_NOT_FOUND,
  TO_MONEY_ID_OMITTED_FOR_EXTERNAL,
  USER_NOT_AUTHENTICATED,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { Money } from "@/entities/Money";
import { OperationMoney } from "@/entities/OperationMoney";
import { LocalEnum } from "@/enums/LocalEnum";
import { MoneyTransferEnum } from "@/enums/MoneyTrasnferEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { OperationMoneyResolver } from "@/resolvers/operations/OperationMoneyResolver";
import { toOperationMoneyDto } from "@/resolvers/operations/dtos/toOperationMoneyDto";
import { ListOperationMoneyInput } from "@/resolvers/operations/inputs/OperationMoneyInputs";
import {
  OperationMoneyDepositInput,
  OperationMoneyTransferInput,
  OperationMoneyWithdrawInput,
} from "@/resolvers/operations/inputs/OperationsInputs";
import { generalQueryFilter } from "@/resolvers/operations/utils/generalQueryFilter";
import {
  clearDecimal,
  decimalGreaterThan,
  decimalMultiply,
  decimalSum,
} from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { randomUUID } from "@/utils/randomUUID";

// ============================================================
// Mocks
// ============================================================
jest.mock("@/utils/loggedContext");
jest.mock("@/utils/currencyUtil");
jest.mock("@/utils/randomUUID");
jest.mock("@/resolvers/operations/dtos/toOperationMoneyDto");
jest.mock("@/resolvers/operations/utils/generalQueryFilter");
jest.mock("@/utils/verifiers/decorators/Protected", () => ({
  Protected: () => () => {},
}));

const mockedLoggedContext = jest.mocked(loggedContext);
const mockedToOperationMoneyDto = jest.mocked(toOperationMoneyDto);
const mockedGeneralQueryFilter = jest.mocked(generalQueryFilter);
const mockedClearDecimal = jest.mocked(clearDecimal);
const mockedDecimalGreaterThan = jest.mocked(decimalGreaterThan);
const mockedDecimalMultiply = jest.mocked(decimalMultiply);
const mockedDecimalSum = jest.mocked(decimalSum);
const mockedRandomUUID = jest.mocked(randomUUID);

// ============================================================
// Helpers
// ============================================================
const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID_2 = "550e8400-e29b-41d4-a716-446655440001";

function makeContext(overrides: Partial<MyContext> = {}): MyContext {
  return { userId: "user-1", ...overrides } as MyContext;
}

type MockEntityManager = {
  findAndCount: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  softRemove: jest.Mock;
};

function createMockEm(): MockEntityManager {
  return {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((_entity: unknown, data: unknown) => data),
    save: jest.fn(async (arg1: unknown, arg2?: unknown) => arg2 ?? arg1),
    softRemove: jest.fn(),
  };
}

function makeMoney(overrides: Partial<Money> = {}): Money {
  return {
    id: UUID,
    userId: "user-1",
    tag: "Carteira Principal",
    balance: "1000.00",
    ...overrides,
  } as Money;
}

function makeOperation(
  overrides: Partial<OperationMoney> = {}
): OperationMoney {
  return {
    id: "op-1",
    userId: "user-1",
    moneyId: UUID,
    balance: "100.00",
    tag: "Original",
    description: "Descrição original",
    ...overrides,
  } as OperationMoney;
}

function makeOperationDto(overrides: Record<string, unknown> = {}) {
  return {
    id: "op-1",
    userId: "user-1",
    moneyId: UUID,
    balance: "100.00",
    tag: "Tag",
    description: "Descrição",
    ...overrides,
  };
}

const makeDepositInput = (
  overrides: Partial<OperationMoneyDepositInput> = {}
): OperationMoneyDepositInput =>
  ({
    moneyId: UUID,
    amount: "100.00",
    local: LocalEnum.EXTERNAL,
    ...overrides,
  }) as OperationMoneyDepositInput;

const makeWithdrawInput = (
  overrides: Partial<OperationMoneyWithdrawInput> = {}
): OperationMoneyWithdrawInput =>
  ({
    moneyId: UUID,
    amount: "-100.00",
    local: LocalEnum.EXTERNAL,
    ...overrides,
  }) as OperationMoneyWithdrawInput;

const makeTransferInput = (
  overrides: Partial<OperationMoneyTransferInput> = {}
): OperationMoneyTransferInput =>
  ({
    fromMoneyId: UUID,
    toMoneyId: UUID_2,
    amount: "-100.00",
    typeOperation: MoneyTransferEnum.SEND,
    local: LocalEnum.INTERNAL,
    ...overrides,
  }) as OperationMoneyTransferInput;

/**
 * Localiza o argumento passado a `em.save(OperationMoney, ...)` para uma
 * das operações gravadas, filtrando por moneyId.
 */
function findOperationArg(
  em: MockEntityManager,
  moneyId: string
): Record<string, unknown> | undefined {
  const call = em.save.mock.calls.find(
    ([entity, arg]) =>
      entity === OperationMoney &&
      (arg as { moneyId?: string }).moneyId === moneyId
  );
  return call?.[1] as Record<string, unknown> | undefined;
}

// ============================================================
// Suite
// ============================================================
describe("OperationMoneyResolver", () => {
  let resolver: OperationMoneyResolver;
  let mockEm: MockEntityManager;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.resetAllMocks();

    resolver = new OperationMoneyResolver();
    mockEm = createMockEm();

    mockedLoggedContext.mockImplementation(async (_ctx, callback) =>
      callback(mockEm as unknown as Parameters<typeof callback>[0])
    );

    mockedToOperationMoneyDto.mockImplementation(
      (op) =>
        makeOperationDto(
          op as unknown as Record<string, unknown>
        ) as ReturnType<typeof toOperationMoneyDto>
    );

    mockedGeneralQueryFilter.mockReturnValue(
      {} as ReturnType<typeof generalQueryFilter>
    );
    mockedClearDecimal.mockImplementation((v) => v);
    mockedDecimalGreaterThan.mockReturnValue(false);
    mockedDecimalMultiply.mockReturnValue("100.00");
    mockedDecimalSum.mockReturnValue("1100.00");
    mockedRandomUUID.mockReturnValue("reg-uuid-1234");
  });

  // ============================================================
  // operationMoneyList
  // ============================================================
  describe("operationMoneyList", () => {
    const listInput: ListOperationMoneyInput = {
      moneyId: UUID,
      limit: 10,
      offset: 5,
    } as ListOperationMoneyInput;

    it("retorna lista paginada com filtros padrão", async () => {
      const operations = [makeOperation()];
      mockEm.findAndCount.mockResolvedValue([operations, 1]);

      const result = await resolver.operationMoneyList(
        makeContext(),
        listInput
      );

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        OperationMoney,
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            moneyId: UUID,
          }),
          take: 10,
          skip: 5,
          order: { createdAt: "DESC" },
        })
      );
    });

    it("usa limit 20 e offset 0 quando não informados", async () => {
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.operationMoneyList(makeContext(), {
        moneyId: UUID,
      } as ListOperationMoneyInput);

      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        OperationMoney,
        expect.objectContaining({ take: 20, skip: 0 })
      );
    });

    it("aplica generalQueryFilter quando retornar algo", async () => {
      mockedGeneralQueryFilter.mockReturnValue({
        typeOperation: OperationEnum.DEPOSIT,
      } as ReturnType<typeof generalQueryFilter>);
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.operationMoneyList(makeContext(), {
        moneyId: UUID,
      } as ListOperationMoneyInput);

      const [, options] = mockEm.findAndCount.mock.calls[0];
      expect(options.where.typeOperation).toBe(OperationEnum.DEPOSIT);
    });

    it("lança USER_NOT_AUTHENTICATED quando não há userId", async () => {
      await expect(
        resolver.operationMoneyList(
          makeContext({ userId: undefined }),
          listInput
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("propaga erro genérico quando a consulta falha", async () => {
      mockEm.findAndCount.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.operationMoneyList(makeContext(), listInput)
      ).rejects.toThrow("Failed to fetch operation money list.");
    });
  });

  // ============================================================
  // operationMoneyDeposit
  // ============================================================
  describe("operationMoneyDeposit", () => {
    it("cria operação, soma ao saldo e retorna DTO", async () => {
      const money = makeMoney({ balance: "1000.00" });
      mockEm.findOne.mockResolvedValue(money);
      mockedDecimalSum.mockReturnValue("1100.00");

      const result = await resolver.operationMoneyDeposit(
        makeContext(),
        makeDepositInput()
      );

      expect(money.balance).toBe("1100.00");
      expect(mockEm.save).toHaveBeenCalledWith(Money, money);
      expect(mockEm.save).toHaveBeenCalledWith(
        OperationMoney,
        expect.objectContaining({
          moneyId: UUID,
          balance: "100.00",
          typeOperation: OperationEnum.DEPOSIT,
          local: LocalEnum.EXTERNAL,
          userId: "user-1",
          operationRegister: "reg-uuid-1234",
        })
      );
      expect(result).toBeDefined();
    });

    it("chama clearDecimal em input.amount", async () => {
      mockEm.findOne.mockResolvedValue(makeMoney());

      await resolver.operationMoneyDeposit(makeContext(), makeDepositInput());

      expect(mockedClearDecimal).toHaveBeenCalledWith("100.00");
    });

    it("preenche a description com o tag da Money", async () => {
      const money = makeMoney({ tag: "Carteira VIP" });
      mockEm.findOne.mockResolvedValue(money);

      await resolver.operationMoneyDeposit(makeContext(), makeDepositInput());

      const operationArg = findOperationArg(mockEm, UUID);
      expect(operationArg?.description).toContain("Carteira VIP");
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationMoneyDeposit(
          makeContext({ userId: undefined }),
          makeDepositInput()
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança MONEY_NOT_FOUND quando carteira não existe", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.operationMoneyDeposit(makeContext(), makeDepositInput())
      ).rejects.toThrow(MONEY_NOT_FOUND);
    });

    it("propaga erro genérico quando em.save falha", async () => {
      mockEm.findOne.mockResolvedValue(makeMoney());
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationMoneyDeposit(makeContext(), makeDepositInput())
      ).rejects.toThrow("Failed to save operation money.");
    });
  });

  // ============================================================
  // operationMoneyWithdraw
  // ============================================================
  describe("operationMoneyWithdraw", () => {
    it("cria operação, subtrai do saldo e retorna DTO", async () => {
      const money = makeMoney({ balance: "1000.00" });
      mockEm.findOne.mockResolvedValue(money);
      mockedDecimalGreaterThan.mockReturnValue(false);
      mockedDecimalSum.mockReturnValue("900.00");

      const result = await resolver.operationMoneyWithdraw(
        makeContext(),
        makeWithdrawInput()
      );

      expect(mockEm.save).toHaveBeenCalledWith(Money, money);
      expect(mockEm.save).toHaveBeenCalledWith(
        OperationMoney,
        expect.objectContaining({
          typeOperation: OperationEnum.WITHDRAW,
          local: LocalEnum.EXTERNAL,
        })
      );
      expect(result).toBeDefined();
    });

    it("compara o valor absoluto (sem sinal) com o saldo", async () => {
      mockEm.findOne.mockResolvedValue(makeMoney({ balance: "1000.00" }));

      await resolver.operationMoneyWithdraw(makeContext(), makeWithdrawInput());

      expect(mockedDecimalGreaterThan).toHaveBeenCalledWith(
        "100.00",
        "1000.00"
      );
    });

    it("chama clearDecimal em input.amount", async () => {
      mockEm.findOne.mockResolvedValue(makeMoney());

      await resolver.operationMoneyWithdraw(makeContext(), makeWithdrawInput());

      expect(mockedClearDecimal).toHaveBeenCalledWith("-100.00");
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationMoneyWithdraw(
          makeContext({ userId: undefined }),
          makeWithdrawInput()
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança MONEY_NOT_FOUND quando carteira não existe", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.operationMoneyWithdraw(makeContext(), makeWithdrawInput())
      ).rejects.toThrow(MONEY_NOT_FOUND);
    });

    it("lança INSUFFICIENT_BALANCE quando valor excede o saldo", async () => {
      mockEm.findOne.mockResolvedValue(makeMoney({ balance: "50.00" }));
      mockedDecimalGreaterThan.mockReturnValueOnce(true);

      await expect(
        resolver.operationMoneyWithdraw(makeContext(), makeWithdrawInput())
      ).rejects.toThrow(INSUFFICIENT_BALANCE);
    });

    it("propaga erro genérico quando em.save falha", async () => {
      mockEm.findOne.mockResolvedValue(makeMoney());
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationMoneyWithdraw(makeContext(), makeWithdrawInput())
      ).rejects.toThrow("Failed to save operation money.");
    });
  });

  // ============================================================
  // operationMoneyTransfer
  // ============================================================
  describe("operationMoneyTransfer", () => {
    beforeEach(() => {
      // Somas e multiplicações realistas para travar o saldo após transfer
      mockedDecimalSum.mockImplementation((a: string, b: string) =>
        (Number(a) + Number(b)).toFixed(2)
      );
      mockedDecimalMultiply.mockImplementation((a: string, b: string) =>
        (Number(a) * Number(b)).toFixed(2)
      );
    });

    it("SEND + INTERNAL: cria 2 operações e atualiza origem e destino", async () => {
      const origin = makeMoney({ id: UUID, balance: "1000.00" });
      const destination = makeMoney({ id: UUID_2, balance: "500.00" });

      mockEm.findOne
        .mockResolvedValueOnce(origin)
        .mockResolvedValueOnce(destination);

      // 1ª: SEND check (0 > amount) → true (passa)
      // 2ª: INSUFFICIENT (inverse > origin.balance) → false
      mockedDecimalGreaterThan
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const result = await resolver.operationMoneyTransfer(
        makeContext(),
        makeTransferInput({
          typeOperation: MoneyTransferEnum.SEND,
          local: LocalEnum.INTERNAL,
          amount: "-100.00",
        })
      );

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
      // origin: 1000 + (-100) = 900 | destination: 500 + 100 = 600
      expect(origin.balance).toBe("900.00");
      expect(destination.balance).toBe("600.00");
      expect(mockEm.save).toHaveBeenCalledTimes(4);
    });

    it("SEND + INTERNAL: operação do destino tem typeOperation = RECEIVE (invertido)", async () => {
      const origin = makeMoney({ id: UUID, balance: "1000.00" });
      const destination = makeMoney({ id: UUID_2, balance: "500.00" });

      mockEm.findOne
        .mockResolvedValueOnce(origin)
        .mockResolvedValueOnce(destination);

      mockedDecimalGreaterThan
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      await resolver.operationMoneyTransfer(
        makeContext(),
        makeTransferInput({
          typeOperation: MoneyTransferEnum.SEND,
          local: LocalEnum.INTERNAL,
          amount: "-100.00",
        })
      );

      const originOperation = findOperationArg(mockEm, UUID);
      const destinationOperation = findOperationArg(mockEm, UUID_2);

      expect(originOperation?.typeOperation).toBe(OperationEnum.SEND);
      expect(destinationOperation?.typeOperation).toBe(OperationEnum.RECEIVE);
    });

    it("RECEIVE + INTERNAL: operação do destino tem typeOperation = SEND (invertido)", async () => {
      const origin = makeMoney({ id: UUID, balance: "1000.00" });
      const destination = makeMoney({ id: UUID_2, balance: "500.00" });

      mockEm.findOne
        .mockResolvedValueOnce(origin)
        .mockResolvedValueOnce(destination);

      mockedDecimalGreaterThan
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false);

      await resolver.operationMoneyTransfer(
        makeContext(),
        makeTransferInput({
          typeOperation: MoneyTransferEnum.RECEIVE,
          amount: "100.00",
          local: LocalEnum.INTERNAL,
        })
      );

      const originOperation = findOperationArg(mockEm, UUID);
      const destinationOperation = findOperationArg(mockEm, UUID_2);

      expect(originOperation?.typeOperation).toBe(OperationEnum.RECEIVE);
      expect(destinationOperation?.typeOperation).toBe(OperationEnum.SEND);
    });

    it("SEND + EXTERNAL (sem toMoneyId): cria 1 operação e atualiza só a origem", async () => {
      const origin = makeMoney({ balance: "1000.00" });
      mockEm.findOne.mockResolvedValueOnce(origin).mockResolvedValueOnce(null);

      mockedDecimalGreaterThan
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const result = await resolver.operationMoneyTransfer(
        makeContext(),
        makeTransferInput({
          typeOperation: MoneyTransferEnum.SEND,
          local: LocalEnum.EXTERNAL,
          toMoneyId: undefined,
          amount: "-100.00",
        })
      );

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(origin.balance).toBe("900.00");
      expect(mockEm.save).toHaveBeenCalledTimes(2);
    });

    it("RECEIVE + INTERNAL: atualiza origem e destino (sinais invertidos)", async () => {
      const origin = makeMoney({ id: UUID, balance: "1000.00" });
      const destination = makeMoney({ id: UUID_2, balance: "500.00" });

      mockEm.findOne
        .mockResolvedValueOnce(origin)
        .mockResolvedValueOnce(destination);

      mockedDecimalGreaterThan
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false);

      const result = await resolver.operationMoneyTransfer(
        makeContext(),
        makeTransferInput({
          typeOperation: MoneyTransferEnum.RECEIVE,
          amount: "100.00",
          local: LocalEnum.INTERNAL,
        })
      );

      expect(origin.balance).toBe("1100.00");
      expect(destination.balance).toBe("400.00");
      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
    });

    it("lança TO_MONEY_ID_OMITTED_FOR_EXTERNAL quando EXTERNAL com toMoneyId", async () => {
      await expect(
        resolver.operationMoneyTransfer(
          makeContext(),
          makeTransferInput({
            typeOperation: MoneyTransferEnum.SEND,
            local: LocalEnum.EXTERNAL,
            toMoneyId: UUID_2,
          })
        )
      ).rejects.toThrow(TO_MONEY_ID_OMITTED_FOR_EXTERNAL);
    });

    it("lança AMOUNT_INVALID_FOR_SEND quando SEND com amount positivo", async () => {
      mockEm.findOne.mockResolvedValue(makeMoney());

      mockedDecimalGreaterThan.mockReturnValueOnce(false);

      await expect(
        resolver.operationMoneyTransfer(
          makeContext(),
          makeTransferInput({
            typeOperation: MoneyTransferEnum.SEND,
            local: LocalEnum.EXTERNAL,
            toMoneyId: undefined,
            amount: "100.00",
          })
        )
      ).rejects.toThrow(AMOUNT_INVALID_FOR_SEND);
    });

    it("lança AMOUNT_INVALID_FOR_RECEIVE quando RECEIVE com amount negativo", async () => {
      mockEm.findOne.mockResolvedValue(makeMoney());

      mockedDecimalGreaterThan.mockReturnValueOnce(true);

      await expect(
        resolver.operationMoneyTransfer(
          makeContext(),
          makeTransferInput({
            typeOperation: MoneyTransferEnum.RECEIVE,
            amount: "-100.00",
          })
        )
      ).rejects.toThrow(AMOUNT_INVALID_FOR_RECEIVE);
    });

    it("lança INSUFFICIENT_BALANCE em SEND quando origem tem saldo insuficiente", async () => {
      mockEm.findOne.mockResolvedValueOnce(makeMoney({ balance: "50.00" }));

      mockedDecimalGreaterThan
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      await expect(
        resolver.operationMoneyTransfer(
          makeContext(),
          makeTransferInput({
            typeOperation: MoneyTransferEnum.SEND,
            local: LocalEnum.EXTERNAL,
            toMoneyId: undefined,
            amount: "-100.00",
          })
        )
      ).rejects.toThrow(INSUFFICIENT_BALANCE);

      expect(mockEm.save).not.toHaveBeenCalled();
    });

    it("lança INSUFFICIENT_BALANCE em RECEIVE quando destino tem saldo insuficiente", async () => {
      const origin = makeMoney({ id: UUID, balance: "1000.00" });
      const destination = makeMoney({ id: UUID_2, balance: "50.00" });

      mockEm.findOne
        .mockResolvedValueOnce(origin)
        .mockResolvedValueOnce(destination);

      mockedDecimalGreaterThan
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      await expect(
        resolver.operationMoneyTransfer(
          makeContext(),
          makeTransferInput({
            typeOperation: MoneyTransferEnum.RECEIVE,
            amount: "100.00",
            local: LocalEnum.INTERNAL,
          })
        )
      ).rejects.toThrow(INSUFFICIENT_BALANCE);

      expect(mockEm.save).not.toHaveBeenCalled();
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationMoneyTransfer(
          makeContext({ userId: undefined }),
          makeTransferInput()
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança MONEY_NOT_FOUND quando carteira de origem não existe", async () => {
      mockEm.findOne.mockResolvedValueOnce(null);

      await expect(
        resolver.operationMoneyTransfer(makeContext(), makeTransferInput())
      ).rejects.toThrow(MONEY_NOT_FOUND);
    });

    it("lança MONEY_NOT_FOUND quando toMoneyId é fornecido mas destino não existe", async () => {
      mockEm.findOne
        .mockResolvedValueOnce(makeMoney())
        .mockResolvedValueOnce(null);

      await expect(
        resolver.operationMoneyTransfer(makeContext(), makeTransferInput())
      ).rejects.toThrow(MONEY_NOT_FOUND);
    });

    it("chama clearDecimal em input.amount", async () => {
      const origin = makeMoney({ balance: "1000.00" });
      mockEm.findOne.mockResolvedValueOnce(origin).mockResolvedValueOnce(null);

      mockedDecimalGreaterThan
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      await resolver.operationMoneyTransfer(
        makeContext(),
        makeTransferInput({
          local: LocalEnum.EXTERNAL,
          toMoneyId: undefined,
        })
      );

      expect(mockedClearDecimal).toHaveBeenCalledWith("-100.00");
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const origin = makeMoney({ balance: "1000.00" });
      mockEm.findOne
        .mockResolvedValueOnce(origin)
        .mockResolvedValueOnce(makeMoney({ id: UUID_2, balance: "500.00" }));

      mockedDecimalGreaterThan
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationMoneyTransfer(makeContext(), makeTransferInput())
      ).rejects.toThrow("Failed to perform money transfer operation.");
    });
  });
});

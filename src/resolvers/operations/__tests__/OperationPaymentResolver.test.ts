import "reflect-metadata";

import {
  INSUFFICIENT_BALANCE,
  INVALID_OPERATION_ID,
  MONEY_OR_BANK_ACCOUNT_NOT_FOUND,
  ONLY_ONE_ID_MUST_BE_PROVIDED,
  OPERATION_NOT_FOUND,
  PAYMENT_NOT_FOUND,
  USER_NOT_AUTHENTICATED,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { OperationPayment } from "@/entities/OperationPayment";
import { Payment } from "@/entities/Payment";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { OperationPaymentResolver } from "@/resolvers/operations/OperationPaymentResolver";
import { toOperationPaymentDto } from "@/resolvers/operations/dtos/toOperationPaymentDto";
import {
  CreateOperationPaymentInput,
  ListOperationPaymentInput,
  UpdateOperationPaymentInput,
} from "@/resolvers/operations/inputs/OperationPaymentInputs";
import { generalQueryFilter } from "@/resolvers/operations/utils/generalQueryFilter";
import { uuidFourVerify } from "@/resolvers/operations/utils/operationUtils";
import {
  decimalGreaterThan,
  decimalSubtract,
  decimalSumSequence,
} from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { randomUUID } from "@/utils/randomUUID";

// ============================================================
// Mocks
// ============================================================
jest.mock("@/utils/loggedContext");
jest.mock("@/utils/currencyUtil");
jest.mock("@/utils/randomUUID");
jest.mock("@/resolvers/operations/dtos/toOperationPaymentDto");
jest.mock("@/resolvers/operations/utils/generalQueryFilter");
jest.mock("@/resolvers/operations/utils/operationUtils");
jest.mock("@/utils/verifiers/decorators/Protected", () => ({
  Protected: () => () => {},
}));

const mockedLoggedContext = jest.mocked(loggedContext);
const mockedToOperationPaymentDto = jest.mocked(toOperationPaymentDto);
const mockedGeneralQueryFilter = jest.mocked(generalQueryFilter);
const mockedUuidFourVerify = jest.mocked(uuidFourVerify);
const mockedDecimalGreaterThan = jest.mocked(decimalGreaterThan);
const mockedDecimalSubtract = jest.mocked(decimalSubtract);
const mockedDecimalSumSequence = jest.mocked(decimalSumSequence);
const mockedRandomUUID = jest.mocked(randomUUID);

// ============================================================
// Helpers
// ============================================================
const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID_2 = "550e8400-e29b-41d4-a716-446655440001";
const UUID_3 = "550e8400-e29b-41d4-a716-446655440002";

function makeContext(overrides: Partial<MyContext> = {}): MyContext {
  return { userId: UUID, ...overrides } as MyContext;
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

type MockAccount = {
  id: string;
  userId: string;
  balance: string;
  save: jest.Mock;
};

function makeAccount(overrides: Partial<MockAccount> = {}): MockAccount {
  return {
    id: UUID_3,
    userId: UUID,
    balance: "1000.00",
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: UUID_2,
    userId: UUID,
    ...overrides,
  } as Payment;
}

function makeOperationPayment(
  overrides: Partial<OperationPayment> = {}
): OperationPayment {
  return {
    id: UUID,
    operationRegister: "reg-1",
    userId: UUID,
    paymentId: UUID_2,
    bankId: UUID_3,
    genericBankId: null,
    moneyId: null,
    tag: "Tag original",
    description: "Descrição original",
    balance: "100.00",
    discount: null,
    forfeit: null,
    amount: "100.00",
    typeOperation: OperationEnum.PAYMENT,
    local: LocalEnum.INTERNAL,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  } as OperationPayment;
}

function makeOperationPaymentDto(
  overrides: Partial<ReturnType<typeof toOperationPaymentDto>> = {}
): ReturnType<typeof toOperationPaymentDto> {
  return {
    id: UUID,
    operationRegister: "reg-1",
    userId: UUID,
    paymentId: UUID_2,
    bankId: UUID_3,
    genericBankId: null,
    moneyId: null,
    tag: "Tag",
    description: "Descrição",
    balance: "100.00",
    discount: null,
    forfeit: null,
    amount: "100.00",
    typeOperation: OperationEnum.PAYMENT,
    local: LocalEnum.INTERNAL,
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const makeCreateInput = (
  overrides: Partial<CreateOperationPaymentInput> = {}
): CreateOperationPaymentInput => ({
  paymentId: UUID_2,
  bankId: UUID_3,
  balance: "100.00",
  tag: "Tag padrão",
  local: LocalEnum.INTERNAL,
  ...overrides,
});

const makeUpdateInput = (
  overrides: Partial<UpdateOperationPaymentInput> = {}
): UpdateOperationPaymentInput => ({
  tag: "Nova tag",
  description: "Nova descrição",
  ...overrides,
});

const makeListInput = (
  overrides: Partial<ListOperationPaymentInput> = {}
): ListOperationPaymentInput => ({
  paymentId: UUID_2,
  ...overrides,
});

// ============================================================
// Suite
// ============================================================
describe("OperationPaymentResolver", () => {
  let resolver: OperationPaymentResolver;
  let mockEm: MockEntityManager;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.resetAllMocks();

    resolver = new OperationPaymentResolver();
    mockEm = createMockEm();

    mockedLoggedContext.mockImplementation(async (_ctx, callback) =>
      callback(mockEm as unknown as Parameters<typeof callback>[0])
    );

    mockedToOperationPaymentDto.mockImplementation(
      (op) =>
        makeOperationPaymentDto(
          op as unknown as Partial<ReturnType<typeof toOperationPaymentDto>>
        ) as ReturnType<typeof toOperationPaymentDto>
    );

    mockedGeneralQueryFilter.mockReturnValue({});
    mockedUuidFourVerify.mockReturnValue(true);
    mockedDecimalGreaterThan.mockReturnValue(false);
    mockedDecimalSubtract.mockReturnValue("900.00");
    mockedDecimalSumSequence.mockReturnValue("100.00");
    mockedRandomUUID.mockReturnValue("reg-uuid-1234");
  });

  // ============================================================
  // operationPaymentList
  // ============================================================
  describe("operationPaymentList", () => {
    it("retorna lista paginada com filtros padrão", async () => {
      const operations = [makeOperationPayment()];
      mockEm.findAndCount.mockResolvedValue([operations, 1]);

      const result = await resolver.operationPaymentList(
        makeContext(),
        makeListInput({ limit: 10, offset: 5 })
      );

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        OperationPayment,
        expect.objectContaining({
          where: expect.objectContaining({
            userId: UUID,
            paymentId: UUID_2,
          }),
          take: 10,
          skip: 5,
          order: { createdAt: "DESC" },
        })
      );
    });

    it("usa limit 20 e offset 0 quando não informados", async () => {
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.operationPaymentList(makeContext(), makeListInput());

      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        OperationPayment,
        expect.objectContaining({ take: 20, skip: 0 })
      );
    });

    it("aplica generalQueryFilter quando retornar algo", async () => {
      mockedGeneralQueryFilter.mockReturnValue({
        typeOperation: OperationEnum.PAYMENT,
      });
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.operationPaymentList(makeContext(), makeListInput());

      const [, options] = mockEm.findAndCount.mock.calls[0];
      expect(options.where.typeOperation).toBe(OperationEnum.PAYMENT);
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationPaymentList(
          makeContext({ userId: undefined }),
          makeListInput()
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("propaga erro genérico quando findAndCount falha", async () => {
      mockEm.findAndCount.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.operationPaymentList(makeContext(), makeListInput())
      ).rejects.toThrow("Failed to fetch operation generic bank list.");
    });
  });

  // ============================================================
  // operationPaymentUpdate
  // ============================================================
  describe("operationPaymentUpdate", () => {
    it("atualiza tag e description, salva e retorna o DTO", async () => {
      const operation = makeOperationPayment({
        tag: "Original",
        description: "Original",
      });
      mockEm.findOne.mockResolvedValue(operation);

      const result = await resolver.operationPaymentUpdate(
        makeContext(),
        UUID,
        makeUpdateInput({ tag: "Nova", description: "Nova desc" })
      );

      expect(operation.tag).toBe("Nova");
      expect(operation.description).toBe("Nova desc");
      expect(mockEm.save).toHaveBeenCalledWith(OperationPayment, operation);
      expect(result).toBeDefined();
    });

    it("mantém valores originais quando input vazio", async () => {
      const operation = makeOperationPayment({
        tag: "Original",
        description: "Original",
      });
      mockEm.findOne.mockResolvedValue(operation);

      await resolver.operationPaymentUpdate(
        makeContext(),
        UUID,
        {} as UpdateOperationPaymentInput
      );

      expect(operation.tag).toBe("Original");
      expect(operation.description).toBe("Original");
    });

    it("aceita description null explícito", async () => {
      const operation = makeOperationPayment({ description: "Original" });
      mockEm.findOne.mockResolvedValue(operation);

      await resolver.operationPaymentUpdate(makeContext(), UUID, {
        description: null,
      });

      expect(operation.description).toBeNull();
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationPaymentUpdate(
          makeContext({ userId: undefined }),
          UUID,
          makeUpdateInput()
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança INVALID_OPERATION_ID quando uuid inválido", async () => {
      mockedUuidFourVerify.mockReturnValue(false);

      await expect(
        resolver.operationPaymentUpdate(
          makeContext(),
          "invalid-uuid",
          makeUpdateInput()
        )
      ).rejects.toThrow(INVALID_OPERATION_ID);
    });

    it("lança OPERATION_NOT_FOUND quando operação não existe", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.operationPaymentUpdate(makeContext(), UUID, makeUpdateInput())
      ).rejects.toThrow(OPERATION_NOT_FOUND);
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const operation = makeOperationPayment();
      mockEm.findOne.mockResolvedValue(operation);
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationPaymentUpdate(makeContext(), UUID, makeUpdateInput())
      ).rejects.toThrow("Failed to update operation payment.");
    });
  });

  // ============================================================
  // operationMakePayment
  // ============================================================
  describe("operationMakePayment", () => {
    it("sucesso com bankId: subtrai do saldo, chama account.save e cria operação completa", async () => {
      const payment = makePayment();
      const bank = makeAccount({ id: UUID_3, balance: "1000.00" });
      mockEm.findOne.mockResolvedValueOnce(payment).mockResolvedValueOnce(bank);

      const result = await resolver.operationMakePayment(
        makeContext(),
        makeCreateInput({ bankId: UUID_3 })
      );

      expect(bank.balance).toBe("900.00");
      expect(bank.save).toHaveBeenCalledTimes(1);
      expect(mockEm.save).toHaveBeenCalledWith(
        OperationPayment,
        expect.objectContaining({
          userId: UUID,
          paymentId: UUID_2,
          bankId: UUID_3,
          tag: "Tag padrão",
          description: null,
          balance: "100.00",
          discount: null,
          forfeit: null,
          typeOperation: OperationEnum.PAYMENT,
          local: LocalEnum.INTERNAL,
          amount: "100.00",
          operationRegister: "reg-uuid-1234",
        })
      );
      expect(result).toBeDefined();
    });

    it("sucesso com genericBankId", async () => {
      const payment = makePayment();
      const genericBank = makeAccount({ id: UUID_3, balance: "1000.00" });
      mockEm.findOne
        .mockResolvedValueOnce(payment)
        .mockResolvedValueOnce(genericBank);

      await resolver.operationMakePayment(
        makeContext(),
        makeCreateInput({ bankId: null, genericBankId: UUID_3 })
      );

      expect(mockEm.save).toHaveBeenCalledWith(
        OperationPayment,
        expect.objectContaining({
          genericBankId: UUID_3,
        })
      );
    });

    it("sucesso com moneyId", async () => {
      const payment = makePayment();
      const money = makeAccount({ id: UUID_3, balance: "1000.00" });
      mockEm.findOne
        .mockResolvedValueOnce(payment)
        .mockResolvedValueOnce(money);

      await resolver.operationMakePayment(
        makeContext(),
        makeCreateInput({ bankId: null, moneyId: UUID_3 })
      );

      expect(mockEm.save).toHaveBeenCalledWith(
        OperationPayment,
        expect.objectContaining({
          moneyId: UUID_3,
        })
      );
    });

    it("envia tag do input para em.save", async () => {
      const payment = makePayment();
      const bank = makeAccount();
      mockEm.findOne.mockResolvedValueOnce(payment).mockResolvedValueOnce(bank);

      await resolver.operationMakePayment(
        makeContext(),
        makeCreateInput({ tag: "Minha tag custom" })
      );

      expect(mockEm.save).toHaveBeenCalledWith(
        OperationPayment,
        expect.objectContaining({ tag: "Minha tag custom" })
      );
    });

    it("envia description do input quando fornecida", async () => {
      const payment = makePayment();
      const bank = makeAccount();
      mockEm.findOne.mockResolvedValueOnce(payment).mockResolvedValueOnce(bank);

      await resolver.operationMakePayment(
        makeContext(),
        makeCreateInput({ description: "Descrição custom" })
      );

      expect(mockEm.save).toHaveBeenCalledWith(
        OperationPayment,
        expect.objectContaining({ description: "Descrição custom" })
      );
    });

    it("envia description null quando não fornecida", async () => {
      const payment = makePayment();
      const bank = makeAccount();
      mockEm.findOne.mockResolvedValueOnce(payment).mockResolvedValueOnce(bank);

      await resolver.operationMakePayment(
        makeContext(),
        makeCreateInput({ description: undefined })
      );

      expect(mockEm.save).toHaveBeenCalledWith(
        OperationPayment,
        expect.objectContaining({ description: null })
      );
    });

    it("envia local do input para em.save", async () => {
      const payment = makePayment();
      const bank = makeAccount();
      mockEm.findOne.mockResolvedValueOnce(payment).mockResolvedValueOnce(bank);

      await resolver.operationMakePayment(
        makeContext(),
        makeCreateInput({ local: LocalEnum.EXTERNAL })
      );

      expect(mockEm.save).toHaveBeenCalledWith(
        OperationPayment,
        expect.objectContaining({ local: LocalEnum.EXTERNAL })
      );
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationMakePayment(
          makeContext({ userId: undefined }),
          makeCreateInput()
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança ONLY_ONE_ID_MUST_BE_PROVIDED quando nenhum ID é fornecido", async () => {
      await expect(
        resolver.operationMakePayment(
          makeContext(),
          makeCreateInput({
            bankId: null,
            genericBankId: null,
            moneyId: null,
          })
        )
      ).rejects.toThrow(ONLY_ONE_ID_MUST_BE_PROVIDED);
    });

    it("lança ONLY_ONE_ID_MUST_BE_PROVIDED quando mais de um ID é fornecido", async () => {
      await expect(
        resolver.operationMakePayment(
          makeContext(),
          makeCreateInput({ bankId: UUID_3, genericBankId: UUID })
        )
      ).rejects.toThrow(ONLY_ONE_ID_MUST_BE_PROVIDED);
    });

    it("lança PAYMENT_NOT_FOUND quando payment não existe", async () => {
      mockEm.findOne.mockResolvedValueOnce(null);

      await expect(
        resolver.operationMakePayment(makeContext(), makeCreateInput())
      ).rejects.toThrow(PAYMENT_NOT_FOUND);
    });

    it("lança MONEY_OR_BANK_ACCOUNT_NOT_FOUND quando conta não existe", async () => {
      mockEm.findOne
        .mockResolvedValueOnce(makePayment())
        .mockResolvedValueOnce(null);

      await expect(
        resolver.operationMakePayment(makeContext(), makeCreateInput())
      ).rejects.toThrow(MONEY_OR_BANK_ACCOUNT_NOT_FOUND);
    });

    it("lança INSUFFICIENT_BALANCE quando amount > account.balance", async () => {
      const payment = makePayment();
      const bank = makeAccount({ balance: "10.00" });
      mockEm.findOne.mockResolvedValueOnce(payment).mockResolvedValueOnce(bank);
      mockedDecimalGreaterThan.mockReturnValueOnce(true);

      await expect(
        resolver.operationMakePayment(makeContext(), makeCreateInput())
      ).rejects.toThrow(INSUFFICIENT_BALANCE);

      expect(bank.save).not.toHaveBeenCalled();
      expect(mockEm.save).not.toHaveBeenCalled();
    });

    it("chama decimalSumSequence com balance, discount e forfeit informados", async () => {
      const payment = makePayment();
      const bank = makeAccount();
      mockEm.findOne.mockResolvedValueOnce(payment).mockResolvedValueOnce(bank);

      await resolver.operationMakePayment(
        makeContext(),
        makeCreateInput({
          balance: "100.00",
          discount: "-10.00",
          forfeit: "5.00",
        })
      );

      expect(mockedDecimalSumSequence).toHaveBeenCalledWith([
        "100.00",
        "-10.00",
        "5.00",
      ]);
    });

    it("usa '0.00' quando discount/forfeit são nulos", async () => {
      const payment = makePayment();
      const bank = makeAccount();
      mockEm.findOne.mockResolvedValueOnce(payment).mockResolvedValueOnce(bank);

      await resolver.operationMakePayment(
        makeContext(),
        makeCreateInput({ discount: null, forfeit: null })
      );

      expect(mockedDecimalSumSequence).toHaveBeenCalledWith([
        "100.00",
        "0.00",
        "0.00",
      ]);
    });

    it("chama decimalSubtract(balance, amount) e randomUUID(7)", async () => {
      const payment = makePayment();
      const bank = makeAccount({ balance: "1000.00" });
      mockEm.findOne.mockResolvedValueOnce(payment).mockResolvedValueOnce(bank);

      await resolver.operationMakePayment(makeContext(), makeCreateInput());

      expect(mockedDecimalSubtract).toHaveBeenCalledWith("1000.00", "100.00");
      expect(mockedRandomUUID).toHaveBeenCalledWith(7);
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const payment = makePayment();
      const bank = makeAccount();
      mockEm.findOne.mockResolvedValueOnce(payment).mockResolvedValueOnce(bank);
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationMakePayment(makeContext(), makeCreateInput())
      ).rejects.toThrow("Failed to process operation payment.");
    });
  });
});

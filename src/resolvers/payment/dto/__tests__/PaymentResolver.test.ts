import "reflect-metadata";

import {
  INVALID_DAY_MONTH_COMBINATION,
  PAYMENT_NOT_FOUND,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { Payment } from "@/entities/Payment";
import { MonthEnum } from "@/enums/MonthEnum";
import { PaymentEnum } from "@/enums/PaymentEnum";
import { RepeatEnum } from "@/enums/RepeatEnum";
import { MessageResponse } from "@/resolvers/MessageResponse";
import {
  CreatePaymentInput,
  ListPaymentInput,
  UpdatePaymentInput,
} from "@/resolvers/payment/PaymentInput";
import { PaymentResolver } from "@/resolvers/payment/PaymentResolver";
import {
  PaginatedPaymentsDto,
  PaymentDto,
} from "@/resolvers/payment/dto/PaymentDto";
import { toPaymentDto } from "@/resolvers/payment/dto/toPaymentDto";
import { clearDecimal } from "@/utils/currencyUtil";
import { isValidMonthAndDay } from "@/utils/dateUtil";
import { loggedContext } from "@/utils/loggedContext";
import { EntityManager } from "typeorm";

// ============================================================
// Mocks (devem vir antes dos imports das funções mockadas)
// ============================================================
jest.mock("@/utils/loggedContext");
jest.mock("@/utils/currencyUtil");
jest.mock("@/utils/dateUtil");
jest.mock("@/resolvers/payment/dto/toPaymentDto", () => ({
  toPaymentDto: jest.fn(),
}));

const mockedLoggedContext = jest.mocked(loggedContext);
const mockedClearDecimal = jest.mocked(clearDecimal);
const mockedIsValidMonthAndDay = jest.mocked(isValidMonthAndDay);
const mockedToPaymentDto = jest.mocked(toPaymentDto);

// ============================================================
// Helpers
// ============================================================
function makeContext(overrides: Partial<MyContext> = {}): MyContext {
  return { userId: "user-1", ...overrides } as MyContext;
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "payment-1",
    userId: "user-1",
    name: "Aluguel",
    description: "Pagamento do aluguel mensal",
    repeat: RepeatEnum.NO_REPEAT,
    balance: "1500.00",
    day: 5,
    month: MonthEnum.JANUARY,
    status: PaymentEnum.ACTIVE,
    createdAt: new Date("2025-01-01T10:00:00.000Z"),
    updatedAt: new Date("2025-01-02T12:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  } as Payment;
}

function makePaymentDto(payment: Payment): PaymentDto {
  return {
    id: payment.id,
    userId: payment.userId,
    name: payment.name,
    description: payment.description ?? null,
    repeat: payment.repeat,
    balance: payment.balance,
    day: payment.day,
    month: payment.month,
    status: payment.status,
    createdAt: payment.createdAt.toISOString(),
  };
}

// Mock do ILike para retornar a string pura (facilita os testes)
jest.mock("typeorm", () => {
  const actual = jest.requireActual("typeorm");
  return {
    ...actual,
    ILike: jest.fn((val: string) => `%${val}%`),
  };
});

// Tipo para o EntityManager mockado
interface MockEntityManager {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  softRemove: jest.Mock;
}

function createMockEm(): MockEntityManager {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
  };
}

function setupEm(
  config: {
    payments?: Payment[];
    total?: number;
    findOneResult?: Payment | null;
    saveError?: Error;
    findAndCountError?: Error;
  } = {}
): MockEntityManager {
  const {
    payments = [],
    total = payments.length,
    findOneResult = null,
    saveError,
    findAndCountError,
  } = config;

  const em = createMockEm();

  em.findAndCount.mockImplementation(async () => {
    if (findAndCountError) throw findAndCountError;
    return [payments, total];
  });

  em.findOne.mockResolvedValue(findOneResult);

  em.save.mockImplementation(async (entity: Payment) => {
    if (saveError) throw saveError;
    return entity;
  });

  em.create.mockImplementation(
    (_entity, data) => ({ ...makePayment(), ...data }) as Payment
  );

  em.softRemove.mockImplementation(async (entity: Payment) => entity);

  mockedLoggedContext.mockImplementation(async (ctx, callback) => {
    return callback(em as unknown as EntityManager);
  });

  return em;
}

// ============================================================
// Testes
// ============================================================
describe("PaymentResolver", () => {
  let resolver: PaymentResolver;

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    resolver = new PaymentResolver();
    jest.clearAllMocks();

    // Mock do clearDecimal para retornar o mesmo valor
    mockedClearDecimal.mockImplementation((value) => value);

    // Mock do isValidMonthAndDay para retornar true por padrão
    mockedIsValidMonthAndDay.mockReturnValue(true);

    // Mock do toPaymentDto para retornar a estrutura correta do DTO
    mockedToPaymentDto.mockImplementation((payment: Payment) =>
      makePaymentDto(payment)
    );
  });

  // ============================================================
  // listPayments
  // ============================================================
  describe("listPayments", () => {
    const listInput: ListPaymentInput = {
      limit: 10,
      offset: 0,
      name: "Aluguel",
      repeat: RepeatEnum.NO_REPEAT,
      month: MonthEnum.JANUARY,
      status: PaymentEnum.ACTIVE,
    };

    it("deve retornar uma lista paginada de pagamentos com todos os filtros", async () => {
      const mockPayment = makePayment();
      const mockItems = [mockPayment];
      const mockTotal = 1;
      const em = setupEm({ payments: mockItems, total: mockTotal });

      const result = await resolver.listPayments(makeContext(), listInput);

      const expectedItems = mockItems.map(makePaymentDto);

      expect(result).toEqual<PaginatedPaymentsDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function)
      );

      expect(em.findAndCount).toHaveBeenCalledWith(Payment, {
        where: {
          userId: "user-1",
          name: expect.stringContaining("Aluguel"),
          repeat: RepeatEnum.NO_REPEAT,
          month: MonthEnum.JANUARY,
          status: PaymentEnum.ACTIVE,
        },
        take: 10,
        skip: 0,
      });
    });

    it("deve retornar lista paginada sem filtros", async () => {
      const mockPayment = makePayment();
      const mockItems = [mockPayment];
      const mockTotal = 1;
      const em = setupEm({ payments: mockItems, total: mockTotal });

      const result = await resolver.listPayments(makeContext(), {});

      const expectedItems = mockItems.map(makePaymentDto);

      expect(result).toEqual<PaginatedPaymentsDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(em.findAndCount).toHaveBeenCalledWith(Payment, {
        where: { userId: "user-1" },
        take: 20,
        skip: 0,
      });
    });

    it("deve usar valores padrão para limit e offset quando não fornecidos", async () => {
      const em = setupEm({});

      await resolver.listPayments(makeContext(), {});

      expect(em.findAndCount).toHaveBeenCalledWith(Payment, {
        where: { userId: "user-1" },
        take: 20,
        skip: 0,
      });
    });

    it("deve usar limit e offset fornecidos", async () => {
      const em = setupEm({});

      await resolver.listPayments(makeContext(), { limit: 5, offset: 10 });

      expect(em.findAndCount).toHaveBeenCalledWith(Payment, {
        where: { userId: "user-1" },
        take: 5,
        skip: 10,
      });
    });

    it("deve aplicar filtro de name quando fornecido", async () => {
      const em = setupEm({});

      await resolver.listPayments(makeContext(), { name: "luz" });

      expect(em.findAndCount).toHaveBeenCalledWith(Payment, {
        where: {
          userId: "user-1",
          name: expect.stringContaining("luz"),
        },
        take: 20,
        skip: 0,
      });
    });

    it("deve aplicar filtro de repeat quando fornecido", async () => {
      const em = setupEm({});

      await resolver.listPayments(makeContext(), { repeat: RepeatEnum.REPEAT });

      expect(em.findAndCount).toHaveBeenCalledWith(Payment, {
        where: {
          userId: "user-1",
          repeat: RepeatEnum.REPEAT,
        },
        take: 20,
        skip: 0,
      });
    });

    it("deve aplicar filtro de month quando fornecido", async () => {
      const em = setupEm({});

      await resolver.listPayments(makeContext(), { month: MonthEnum.MARCH });

      expect(em.findAndCount).toHaveBeenCalledWith(Payment, {
        where: {
          userId: "user-1",
          month: MonthEnum.MARCH,
        },
        take: 20,
        skip: 0,
      });
    });

    it("deve aplicar filtro de status quando fornecido", async () => {
      const em = setupEm({});

      await resolver.listPayments(makeContext(), {
        status: PaymentEnum.INACTIVE,
      });

      expect(em.findAndCount).toHaveBeenCalledWith(Payment, {
        where: {
          userId: "user-1",
          status: PaymentEnum.INACTIVE,
        },
        take: 20,
        skip: 0,
      });
    });

    it("deve lançar erro se a consulta falhar", async () => {
      const em = setupEm({ findAndCountError: new Error("DB error") });

      await expect(resolver.listPayments(makeContext(), {})).rejects.toThrow(
        "DB error"
      );

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  // ============================================================
  // createPayment
  // ============================================================
  describe("createPayment", () => {
    const createInput: CreatePaymentInput = {
      name: "Nova Fatura",
      description: "Descrição da fatura",
      repeat: RepeatEnum.NO_REPEAT,
      balance: "500.00",
      day: 15,
      month: MonthEnum.MARCH,
    };

    it("deve criar um pagamento com sucesso", async () => {
      const createdPayment = makePayment({
        ...createInput,
        userId: "user-1",
        status: PaymentEnum.ACTIVE,
      });
      const em = setupEm({});
      em.create.mockReturnValue(createdPayment);
      em.save.mockResolvedValue(createdPayment);

      const result = await resolver.createPayment(makeContext(), createInput);

      expect(result).toEqual(makePaymentDto(createdPayment));
      expect(mockedIsValidMonthAndDay).toHaveBeenCalledWith(
        MonthEnum.MARCH,
        15
      );
      expect(mockedClearDecimal).toHaveBeenCalledWith("500.00");
      expect(em.create).toHaveBeenCalledWith(Payment, {
        ...createInput,
        userId: "user-1",
        balance: "500.00",
        status: PaymentEnum.ACTIVE,
      });
      expect(em.save).toHaveBeenCalledWith(createdPayment);
      expect(mockedToPaymentDto).toHaveBeenCalledWith(createdPayment);
    });

    it("deve lançar erro se o dia e mês forem inválidos", async () => {
      mockedIsValidMonthAndDay.mockReturnValue(false);

      await expect(
        resolver.createPayment(makeContext(), createInput)
      ).rejects.toThrow(INVALID_DAY_MONTH_COMBINATION);

      expect(mockedLoggedContext).not.toHaveBeenCalled();
      expect(mockedClearDecimal).not.toHaveBeenCalled();
    });

    it("deve lançar erro se a criação falhar", async () => {
      const em = setupEm({ saveError: new Error("DB error") });
      em.create.mockReturnValue({});

      await expect(
        resolver.createPayment(makeContext(), createInput)
      ).rejects.toThrow("DB error");

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  // ============================================================
  // updatePayment
  // ============================================================
  describe("updatePayment", () => {
    const updateInput: UpdatePaymentInput = {
      name: "Fatura Atualizada",
      description: "Nova descrição",
      repeat: RepeatEnum.REPEAT,
      balance: "600.00",
      day: 20,
      month: MonthEnum.JUNE,
      status: PaymentEnum.INACTIVE,
    };

    it("deve atualizar um pagamento com sucesso", async () => {
      const existingPayment = makePayment({
        id: "payment-1",
        userId: "user-1",
      });
      const updatedPayment = makePayment({
        ...existingPayment,
        name: "Fatura Atualizada",
        description: "Nova descrição",
        repeat: RepeatEnum.REPEAT,
        balance: "600.00",
        day: 20,
        month: MonthEnum.JUNE,
        status: PaymentEnum.INACTIVE,
      });

      const em = setupEm({ findOneResult: existingPayment });
      em.save.mockResolvedValue(updatedPayment);

      const result = await resolver.updatePayment(
        makeContext(),
        "payment-1",
        updateInput
      );

      expect(result).toEqual(makePaymentDto(updatedPayment));
      expect(em.findOne).toHaveBeenCalledWith(Payment, {
        where: { id: "payment-1", userId: "user-1" },
      });
      expect(mockedIsValidMonthAndDay).toHaveBeenCalledWith(MonthEnum.JUNE, 20);
      expect(mockedClearDecimal).toHaveBeenCalledWith("600.00");
      expect(em.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Fatura Atualizada",
          description: "Nova descrição",
          repeat: RepeatEnum.REPEAT,
          balance: "600.00",
          day: 20,
          month: MonthEnum.JUNE,
          status: PaymentEnum.INACTIVE,
        })
      );
      expect(mockedToPaymentDto).toHaveBeenCalled();
    });

    it("deve atualizar apenas os campos fornecidos (operador nullish)", async () => {
      const existingPayment = makePayment({
        id: "payment-1",
        name: "Original",
        description: "Descrição original",
        repeat: RepeatEnum.NO_REPEAT,
        balance: "100.00",
        day: 1,
        month: MonthEnum.JANUARY,
        status: PaymentEnum.ACTIVE,
      });
      const inputParcial: UpdatePaymentInput = { name: "Novo Nome" };

      const em = setupEm({ findOneResult: existingPayment });
      em.save.mockResolvedValue(existingPayment);

      await resolver.updatePayment(makeContext(), "payment-1", inputParcial);

      expect(existingPayment.name).toBe("Novo Nome");
      expect(existingPayment.description).toBe("Descrição original");
      expect(existingPayment.repeat).toBe(RepeatEnum.NO_REPEAT);
      expect(existingPayment.balance).toBe("100.00");
      expect(existingPayment.day).toBe(1);
      expect(existingPayment.month).toBe(MonthEnum.JANUARY);
      expect(existingPayment.status).toBe(PaymentEnum.ACTIVE);
    });

    it("deve permitir atualizar description para null explicitamente", async () => {
      const existingPayment = makePayment({
        id: "payment-1",
        description: "Valor antigo",
      });
      const inputComDescriptionNull: UpdatePaymentInput = {
        description: null,
      };

      const em = setupEm({ findOneResult: existingPayment });
      em.save.mockResolvedValue(existingPayment);

      await resolver.updatePayment(
        makeContext(),
        "payment-1",
        inputComDescriptionNull
      );

      expect(existingPayment.description).toBeNull();
    });

    it("deve manter description quando omitido (undefined)", async () => {
      const existingPayment = makePayment({
        id: "payment-1",
        description: "Descrição original",
      });
      const inputSemDescription: UpdatePaymentInput = {};

      const em = setupEm({ findOneResult: existingPayment });
      em.save.mockResolvedValue(existingPayment);

      await resolver.updatePayment(
        makeContext(),
        "payment-1",
        inputSemDescription
      );

      expect(existingPayment.description).toBe("Descrição original");
    });

    it("deve validar combinação mês/dia apenas quando day ou month são fornecidos", async () => {
      const existingPayment = makePayment({
        id: "payment-1",
        day: 5,
        month: MonthEnum.JANUARY,
      });
      const inputComDay: UpdatePaymentInput = { day: 30 };

      const em = setupEm({ findOneResult: existingPayment });
      em.save.mockResolvedValue(existingPayment);

      await resolver.updatePayment(makeContext(), "payment-1", inputComDay);

      expect(mockedIsValidMonthAndDay).toHaveBeenCalledWith(
        MonthEnum.JANUARY,
        30
      );
    });

    it("deve lançar erro se a combinação mês/dia for inválida", async () => {
      mockedIsValidMonthAndDay.mockReturnValue(false);

      const existingPayment = makePayment({
        id: "payment-1",
        day: 5,
        month: MonthEnum.JANUARY,
      });
      const inputComDay: UpdatePaymentInput = { day: 32 };

      const em = setupEm({ findOneResult: existingPayment });

      await expect(
        resolver.updatePayment(makeContext(), "payment-1", inputComDay)
      ).rejects.toThrow(INVALID_DAY_MONTH_COMBINATION);

      expect(em.save).not.toHaveBeenCalled();
    });

    it("deve lançar erro se o pagamento não for encontrado", async () => {
      const em = setupEm({ findOneResult: null });

      await expect(
        resolver.updatePayment(makeContext(), "inexistente", {})
      ).rejects.toThrow(PAYMENT_NOT_FOUND);

      expect(em.save).not.toHaveBeenCalled();
    });

    it("deve lançar erro se a atualização falhar", async () => {
      const existingPayment = makePayment({ id: "payment-1" });
      const em = setupEm({
        findOneResult: existingPayment,
        saveError: new Error("DB error"),
      });

      await expect(
        resolver.updatePayment(makeContext(), "payment-1", { name: "Novo" })
      ).rejects.toThrow("DB error");
    });
  });

  // ============================================================
  // deletePayment
  // ============================================================
  describe("deletePayment", () => {
    it("deve deletar (soft delete) um pagamento com sucesso", async () => {
      const payment = makePayment({ id: "payment-1" });
      const em = setupEm({ findOneResult: payment });

      const result = await resolver.deletePayment(makeContext(), "payment-1");

      expect(result).toEqual<MessageResponse>({
        message: "Payment deleted successfully.",
      });
      expect(em.findOne).toHaveBeenCalledWith(Payment, {
        where: { id: "payment-1", userId: "user-1" },
      });
      expect(em.softRemove).toHaveBeenCalledWith(payment);
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("deve lançar erro se o pagamento não for encontrado", async () => {
      const em = setupEm({ findOneResult: null });

      await expect(
        resolver.deletePayment(makeContext(), "inexistente")
      ).rejects.toThrow(PAYMENT_NOT_FOUND);

      expect(em.softRemove).not.toHaveBeenCalled();
    });

    it("deve lançar erro se a exclusão falhar", async () => {
      const payment = makePayment({ id: "payment-1" });
      const em = setupEm({ findOneResult: payment });
      em.softRemove.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.deletePayment(makeContext(), "payment-1")
      ).rejects.toThrow("DB error");
    });
  });
});

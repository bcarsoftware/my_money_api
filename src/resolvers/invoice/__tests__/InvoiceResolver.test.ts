import "reflect-metadata";

import {
  CREDIT_LIMIT_EXCEEDED,
  INVOICE_NOT_FOUND,
  USER_BANK_NOT_MATCH,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { Bank } from "@/entities/Bank";
import { Invoice } from "@/entities/Invoice";
import { InvoiceStatusEnum } from "@/enums/InvoiceStatusEnum";
import { RepeatEnum } from "@/enums/RepeatEnum";
import { MessageResponse } from "@/resolvers/MessageResponse";
import {
  CreateInvoiceInput,
  InvoiceRefundInput,
  ListInvoiceInput,
  UpdateInvoiceInput,
} from "@/resolvers/invoice/InvoiceInputs";
import { InvoiceResolver } from "@/resolvers/invoice/InvoiceResolver";
import {
  InvoiceDto,
  PaginatedInvoiceDto,
} from "@/resolvers/invoice/dto/InvoiceDto";
import { toInvoiceDto } from "@/resolvers/invoice/dto/toInvoiceDto";
import {
  clearDecimal,
  decimalGreaterThan,
  decimalMultiply,
  decimalSubtract,
  decimalSum,
} from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";

// ============================================================
// Mocks (devem vir antes dos imports das funções mockadas)
// ============================================================
jest.mock("@/utils/loggedContext");
jest.mock("@/utils/currencyUtil");
jest.mock("@/resolvers/invoice/dto/toInvoiceDto", () => ({
  toInvoiceDto: jest.fn(),
}));

const mockedLoggedContext = jest.mocked(loggedContext);
const mockedClearDecimal = jest.mocked(clearDecimal);
const mockedDecimalMultiply = jest.mocked(decimalMultiply);
const mockedDecimalGreaterThan = jest.mocked(decimalGreaterThan);
const mockedDecimalSubtract = jest.mocked(decimalSubtract);
const mockedDecimalSum = jest.mocked(decimalSum);
const mockedToInvoiceDto = jest.mocked(toInvoiceDto);

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

function makeMockBank(overrides: Partial<Bank> = {}): Bank {
  return {
    id: "bank-456",
    userId: "user-123",
    code: "001",
    name: "Banco do Brasil",
    accountType: "CHECKING" as Bank["accountType"],
    accountNumber: "123456",
    agency: "0001",
    balance: "1500.75",
    actualLimit: "5000.00",
    creditLimit: "5000.00",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    user: null as unknown as Bank["user"],
    ...overrides,
  } as Bank;
}

function makeMockInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "invoice-123",
    bankId: "bank-456",
    name: "Fatura de Luz",
    description: "Conta de luz - vencimento 10/08",
    repeat: RepeatEnum.NO_REPEAT,
    installments: 1,
    paidInstallments: 0,
    balance: "150.00",
    total: "150.00",
    status: InvoiceStatusEnum.ACTIVE,
    bank: makeMockBank(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as Invoice;
}

function makeInvoiceDto(invoice: Invoice): InvoiceDto {
  return {
    id: invoice.id,
    name: invoice.name,
    description: invoice.description,
    repeat: invoice.repeat,
    installments: invoice.installments,
    paidInstallments: invoice.paidInstallments,
    balance: invoice.balance,
    total: invoice.total,
    status: invoice.status,
    createdAt: invoice.createdAt.toISOString(),
  };
}

describe("InvoiceResolver", () => {
  let resolver: InvoiceResolver;
  let mockContext: MyContext;
  let mockEm: MockEntityManager;
  let mockInvoice: Invoice;

  const userId = "user-123";
  const invoiceId = "invoice-123";
  const bankId = "bank-456";

  beforeEach(() => {
    resolver = new InvoiceResolver();
    mockContext = { userId } as MyContext;
    mockEm = createMockEm();
    mockInvoice = makeMockInvoice();

    mockedLoggedContext.mockImplementation(async (ctx, callback) => {
      return callback(mockEm as unknown as Parameters<typeof callback>[0]);
    });

    // Mock das funções de currency
    mockedClearDecimal.mockImplementation((value) => value);
    mockedDecimalMultiply.mockReturnValue("150.00");
    mockedDecimalGreaterThan.mockReturnValue(false);
    mockedDecimalSubtract.mockReturnValue("4850.00");
    mockedDecimalSum.mockReturnValue("5000.00");

    mockedToInvoiceDto.mockImplementation((invoice: Invoice) =>
      makeInvoiceDto(invoice)
    );

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // ============================================================
  // listInvoices
  // ============================================================
  describe("listInvoices", () => {
    const listInput: ListInvoiceInput = {
      limit: 10,
      offset: 0,
      status: InvoiceStatusEnum.ACTIVE,
      repeat: RepeatEnum.NO_REPEAT,
    };

    it("deve retornar uma lista paginada de faturas com filtros", async () => {
      const mockItems = [mockInvoice];
      const mockTotal = 1;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listInvoices(mockContext, listInput);

      const expectedItems = mockItems.map(makeInvoiceDto);

      expect(result).toEqual<PaginatedInvoiceDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findAndCount).toHaveBeenCalledWith(Invoice, {
        where: {
          userId,
          status: listInput.status,
          repeat: listInput.repeat,
        },
        take: listInput.limit,
        skip: listInput.offset,
      });
    });

    it("deve retornar uma lista paginada de faturas sem filtros", async () => {
      const inputSemFiltros: ListInvoiceInput = { limit: 5, offset: 0 };
      const mockItems = [mockInvoice];
      const mockTotal = 1;
      mockEm.findAndCount.mockResolvedValue([mockItems, mockTotal]);

      const result = await resolver.listInvoices(mockContext, inputSemFiltros);

      const expectedItems = mockItems.map(makeInvoiceDto);

      expect(result).toEqual<PaginatedInvoiceDto>({
        items: expectedItems,
        total: mockTotal,
      });

      expect(mockEm.findAndCount).toHaveBeenCalledWith(Invoice, {
        where: { userId },
        take: inputSemFiltros.limit,
        skip: inputSemFiltros.offset,
      });
    });

    it("deve aplicar filtro de status quando fornecido", async () => {
      const inputComStatus: ListInvoiceInput = {
        limit: 10,
        offset: 0,
        status: InvoiceStatusEnum.COMPLETED,
      };
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.listInvoices(mockContext, inputComStatus);

      expect(mockEm.findAndCount).toHaveBeenCalledWith(Invoice, {
        where: {
          userId,
          status: InvoiceStatusEnum.COMPLETED,
        },
        take: inputComStatus.limit,
        skip: inputComStatus.offset,
      });
    });

    it("deve aplicar filtro de repeat quando fornecido", async () => {
      const inputComRepeat: ListInvoiceInput = {
        limit: 10,
        offset: 0,
        repeat: RepeatEnum.REPEAT,
      };
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.listInvoices(mockContext, inputComRepeat);

      expect(mockEm.findAndCount).toHaveBeenCalledWith(Invoice, {
        where: {
          userId,
          repeat: RepeatEnum.REPEAT,
        },
        take: inputComRepeat.limit,
        skip: inputComRepeat.offset,
      });
    });

    it("deve lançar erro se a consulta falhar", async () => {
      mockEm.findAndCount.mockRejectedValue(new Error("DB error"));

      await expect(resolver.listInvoices(mockContext, {})).rejects.toThrow(
        "Failed to list invoices."
      );

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
    });
  });

  // ============================================================
  // createInvoice
  // ============================================================
  describe("createInvoice", () => {
    const createInput: CreateInvoiceInput = {
      bankId: "bank-456",
      name: "Fatura de Luz",
      description: "Conta de luz",
      repeat: RepeatEnum.NO_REPEAT,
      installments: 1,
      balance: "150.00",
    };

    it("deve criar a fatura, atualizar o limite do banco e retornar o DTO", async () => {
      const mockBank = makeMockBank({
        userId,
        actualLimit: "5000.00",
        creditLimit: "5000.00",
      });
      mockEm.findOne.mockResolvedValue(mockBank);

      const createdInvoice = makeMockInvoice({
        ...createInput,
        status: InvoiceStatusEnum.ACTIVE,
        paidInstallments: 0,
      });
      mockEm.create.mockReturnValue(createdInvoice);
      mockEm.save.mockImplementation(async (entity) => entity);

      const result = await resolver.createInvoice(mockContext, createInput);

      // Busca o banco filtrando por id e userId
      expect(mockEm.findOne).toHaveBeenCalledWith(Bank, {
        where: { id: createInput.bankId, userId },
      });

      // Cálculos de currency
      expect(mockedClearDecimal).toHaveBeenCalledWith("150.00");
      expect(mockedDecimalMultiply).toHaveBeenCalledWith("150.00", "1.00");
      expect(mockedDecimalGreaterThan).toHaveBeenCalledWith(
        "150.00",
        "5000.00"
      );
      expect(mockedDecimalSubtract).toHaveBeenCalledWith("5000.00", "150.00");

      // Criação da fatura
      expect(mockEm.create).toHaveBeenCalledWith(Invoice, {
        ...createInput,
        status: InvoiceStatusEnum.ACTIVE,
        paidInstallments: 0,
        userId,
        balance: "150.00",
        total: "150.00",
      });

      // Salva a fatura e o banco (2 saves)
      expect(mockEm.save).toHaveBeenCalledTimes(2);
      expect(mockEm.save).toHaveBeenNthCalledWith(1, createdInvoice);
      expect(mockEm.save).toHaveBeenNthCalledWith(
        2,
        Bank,
        expect.objectContaining({ actualLimit: "4850.00" })
      );

      expect(result).toEqual(makeInvoiceDto(createdInvoice));
    });

    it("deve calcular o total multiplicando o balance pelo número de parcelas", async () => {
      const inputComParcelas: CreateInvoiceInput = {
        ...createInput,
        installments: 3,
        balance: "100.00",
      };
      const mockBank = makeMockBank({ userId });
      mockEm.findOne.mockResolvedValue(mockBank);

      mockedClearDecimal.mockImplementation((v) => v);
      mockedDecimalMultiply.mockReturnValue("300.00");
      mockedDecimalGreaterThan.mockReturnValue(false);

      mockEm.create.mockReturnValue(makeMockInvoice());
      mockEm.save.mockImplementation(async (entity) => entity);

      await resolver.createInvoice(mockContext, inputComParcelas);

      expect(mockedDecimalMultiply).toHaveBeenCalledWith("100.00", "3.00");
    });

    it("deve lançar CREDIT_LIMIT_EXCEEDED quando o total excede o limite do banco", async () => {
      const mockBank = makeMockBank({ userId, actualLimit: "100.00" });
      mockEm.findOne.mockResolvedValue(mockBank);

      mockedClearDecimal.mockImplementation((v) => v);
      mockedDecimalMultiply.mockReturnValue("150.00");
      mockedDecimalGreaterThan.mockReturnValue(true);

      await expect(
        resolver.createInvoice(mockContext, createInput)
      ).rejects.toThrow(CREDIT_LIMIT_EXCEEDED);

      expect(mockEm.create).not.toHaveBeenCalled();
      expect(mockEm.save).not.toHaveBeenCalled();
    });

    it("deve lançar USER_BANK_NOT_MATCH se o banco não existir", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.createInvoice(mockContext, createInput)
      ).rejects.toThrow(USER_BANK_NOT_MATCH);

      expect(mockEm.create).not.toHaveBeenCalled();
    });

    it("deve lançar erro se a criação falhar", async () => {
      const mockBank = makeMockBank({ userId });
      mockEm.findOne.mockResolvedValue(mockBank);

      mockEm.create.mockReturnValue({});
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.createInvoice(mockContext, createInput)
      ).rejects.toThrow("Failed to create invoice.");
    });
  });

  // ============================================================
  // updateInvoice
  // ============================================================
  describe("updateInvoice", () => {
    const updateInput: UpdateInvoiceInput = {
      name: "Fatura Atualizada",
      description: "Nova descrição",
    };

    it("deve atualizar uma fatura com sucesso", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({
        bank: mockBank,
        bankId: mockBank.id,
      });
      const updatedInvoice = makeMockInvoice({
        ...mockInvoiceWithBank,
        name: "Fatura Atualizada",
        description: "Nova descrição",
      });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockResolvedValue(updatedInvoice);

      const result = await resolver.updateInvoice(
        mockContext,
        invoiceId,
        updateInput
      );

      expect(result).toEqual(makeInvoiceDto(updatedInvoice));
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findOne).toHaveBeenCalledWith(Invoice, {
        where: { id: invoiceId },
        relations: { bank: true },
      });
      expect(mockInvoiceWithBank.name).toBe("Fatura Atualizada");
      expect(mockInvoiceWithBank.description).toBe("Nova descrição");
      expect(mockEm.save).toHaveBeenCalledWith(mockInvoiceWithBank);
    });

    it("deve ignorar campos undefined (operador nullish)", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({
        bank: mockBank,
        bankId: mockBank.id,
        name: "Original",
        description: "Descrição original",
      });

      const inputParcial: UpdateInvoiceInput = {};

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockResolvedValue(mockInvoiceWithBank);

      await resolver.updateInvoice(mockContext, invoiceId, inputParcial);

      expect(mockInvoiceWithBank.name).toBe("Original");
      expect(mockInvoiceWithBank.description).toBe("Descrição original");
    });

    it("deve lançar erro se a fatura não for encontrada", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.updateInvoice(mockContext, invoiceId, updateInput)
      ).rejects.toThrow(INVOICE_NOT_FOUND);

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.save).not.toHaveBeenCalled();
    });

    it("deve lançar erro se o banco não pertencer ao usuário", async () => {
      const mockBank = makeMockBank({ userId: "user-different" });
      const mockInvoiceWithBank = makeMockInvoice({ bank: mockBank });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);

      await expect(
        resolver.updateInvoice(mockContext, invoiceId, updateInput)
      ).rejects.toThrow(USER_BANK_NOT_MATCH);

      expect(mockEm.save).not.toHaveBeenCalled();
    });

    it("deve lançar erro se a atualização falhar", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({ bank: mockBank });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.updateInvoice(mockContext, invoiceId, updateInput)
      ).rejects.toThrow("Failed to update invoice.");
    });
  });

  // ============================================================
  // invoiceRefund
  // ============================================================
  describe("invoiceRefund", () => {
    const refundInput: InvoiceRefundInput = {
      id: invoiceId,
      bankId,
    };

    it("deve marcar a fatura como REFUNDED e igualar paidInstallments ao total", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({
        bank: mockBank,
        bankId: mockBank.id,
        installments: 3,
        paidInstallments: 2,
        status: InvoiceStatusEnum.ACTIVE,
      });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockImplementation(async (entity) => entity);

      const result = await resolver.invoiceRefund(mockContext, refundInput);

      expect(mockEm.findOne).toHaveBeenCalledWith(Invoice, {
        where: { id: invoiceId, bankId },
        relations: { bank: true },
      });
      expect(mockInvoiceWithBank.paidInstallments).toBe(3);
      expect(mockInvoiceWithBank.status).toBe(InvoiceStatusEnum.REFUNDED);
      expect(result).toEqual(makeInvoiceDto(mockInvoiceWithBank));
    });

    it("deve recalcular o actualLimit do banco com decimalSum", async () => {
      const mockBank = makeMockBank({
        userId,
        actualLimit: "4850.00",
      });
      const mockInvoiceWithBank = makeMockInvoice({
        bank: mockBank,
        bankId: mockBank.id,
        total: "150.00",
      });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockImplementation(async (entity) => entity);

      mockedDecimalSum.mockReturnValue("5000.00");

      await resolver.invoiceRefund(mockContext, refundInput);

      expect(mockedDecimalSum).toHaveBeenCalledWith("4850.00", "150.00");
      expect(mockEm.save).toHaveBeenNthCalledWith(
        2,
        Bank,
        expect.objectContaining({ actualLimit: "5000.00" })
      );
    });

    it("deve salvar a fatura e o banco associado", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({ bank: mockBank });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockImplementation(async (entity) => entity);

      await resolver.invoiceRefund(mockContext, refundInput);

      expect(mockEm.save).toHaveBeenCalledTimes(2);
      expect(mockEm.save).toHaveBeenNthCalledWith(1, mockInvoiceWithBank);
      expect(mockEm.save).toHaveBeenNthCalledWith(
        2,
        Bank,
        expect.objectContaining({ id: mockBank.id })
      );
    });

    it("deve lançar erro se a fatura não for encontrada", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.invoiceRefund(mockContext, refundInput)
      ).rejects.toThrow(INVOICE_NOT_FOUND);

      expect(mockEm.save).not.toHaveBeenCalled();
    });

    it("deve lançar erro se o banco não pertencer ao usuário", async () => {
      const mockBank = makeMockBank({ userId: "user-different" });
      const mockInvoiceWithBank = makeMockInvoice({ bank: mockBank });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);

      await expect(
        resolver.invoiceRefund(mockContext, refundInput)
      ).rejects.toThrow(USER_BANK_NOT_MATCH);

      expect(mockEm.save).not.toHaveBeenCalled();
    });

    it("deve lançar erro se o save falhar", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({ bank: mockBank });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.invoiceRefund(mockContext, refundInput)
      ).rejects.toThrow("Failed to process invoice refund.");
    });
  });

  // ============================================================
  // deleteInvoice
  // ============================================================
  describe("deleteInvoice", () => {
    it("deve deletar (soft delete) uma fatura com sucesso", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({ bank: mockBank });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.softRemove.mockResolvedValue({} as Invoice);

      const result = await resolver.deleteInvoice(mockContext, invoiceId);

      expect(result).toEqual<MessageResponse>({
        message: "Invoice deleted successfully.",
      });
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.findOne).toHaveBeenCalledWith(Invoice, {
        where: { id: invoiceId },
        relations: { bank: true },
      });
      expect(mockEm.softRemove).toHaveBeenCalledWith(mockInvoiceWithBank);
    });

    it("deve lançar erro se a fatura não for encontrada", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.deleteInvoice(mockContext, invoiceId)
      ).rejects.toThrow(INVOICE_NOT_FOUND);

      expect(mockEm.softRemove).not.toHaveBeenCalled();
    });

    it("deve lançar erro se o banco não pertencer ao usuário", async () => {
      const mockBank = makeMockBank({ userId: "user-different" });
      const mockInvoiceWithBank = makeMockInvoice({ bank: mockBank });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);

      await expect(
        resolver.deleteInvoice(mockContext, invoiceId)
      ).rejects.toThrow(USER_BANK_NOT_MATCH);

      expect(mockEm.softRemove).not.toHaveBeenCalled();
    });

    it("deve lançar erro se a exclusão falhar", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({ bank: mockBank });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.softRemove.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.deleteInvoice(mockContext, invoiceId)
      ).rejects.toThrow("Failed to delete invoice.");
    });
  });
});

import "reflect-metadata";

import { INVOICE_NOT_FOUND, USER_BANK_NOT_MATCH } from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { Bank } from "@/entities/Bank";
import { Invoice } from "@/entities/Invoice";
import { InvoiceStatusEnum } from "@/enums/InvoiceStatusEnum";
import { RepeatEnum } from "@/enums/RepeatEnum";
import { MessageResponse } from "@/resolvers/MessageResponse";
import {
  CreateInvoiceInput,
  InvoicePayInput,
  ListInvoiceInput,
  UpdateInvoiceInput,
} from "@/resolvers/invoice/InvoiceInputs";
import { InvoiceResolver } from "@/resolvers/invoice/InvoiceResolver";
import {
  InvoiceDto,
  PaginatedInvoiceDto,
} from "@/resolvers/invoice/dto/InvoiceDto";
import { toInvoiceDto } from "@/resolvers/invoice/dto/toInvoiceDto";
import { clearDecimal } from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { ILike } from "typeorm";

// ============================================================
// Mocks (devem vir antes dos imports das funções mockadas)
// ============================================================
jest.mock("@/utils/loggedContext");
jest.mock("@/utils/currencyUtil");
jest.mock("@/resolvers/invoice/dto/toInvoiceDto", () => ({
  toInvoiceDto: jest.fn(),
}));

const mockedLoggedContext = loggedContext as jest.MockedFunction<
  typeof loggedContext
>;
const mockedClearDecimal = clearDecimal as jest.MockedFunction<
  typeof clearDecimal
>;
const mockedToInvoiceDto = jest.mocked(toInvoiceDto);

// Tipo para o EntityManager mockado
interface MockEntityManager {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  softRemove: jest.Mock;
}

// Helper para criar um mock de EntityManager
function createMockEm(): MockEntityManager {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
  };
}

// Factory para criar um Bank mockado
function makeMockBank(overrides: Partial<Bank> = {}): Bank {
  return {
    id: "bank-456",
    userId: "user-123",
    code: "001",
    name: "Banco do Brasil",
    accountType: "CHECKING" as any,
    accountNumber: "123456",
    agency: "0001",
    balance: "1500.75",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    user: null as any,
    ...overrides,
  } as Bank;
}

// Factory para criar um Invoice mockado (NÃO possui userId diretamente)
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

// Helper para criar um DTO mockado (compatível com toInvoiceDto)
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

    // Mock do loggedContext para executar o callback com o em mockado
    mockedLoggedContext.mockImplementation(async (ctx, callback) => {
      return callback(mockEm as unknown as Parameters<typeof callback>[0]);
    });

    // Mock do clearDecimal para retornar o mesmo valor
    mockedClearDecimal.mockImplementation((value) => value);

    // Mock do toInvoiceDto para retornar a estrutura correta do DTO
    mockedToInvoiceDto.mockImplementation((invoice: Invoice) =>
      makeInvoiceDto(invoice)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      total: "150.00",
    };

    it("deve criar uma fatura com sucesso", async () => {
      // Invoice NÃO tem userId, então não passamos userId no makeMockInvoice
      const createdInvoice = makeMockInvoice({
        ...createInput,
        status: InvoiceStatusEnum.ACTIVE,
        paidInstallments: 0,
      });
      mockEm.create.mockReturnValue(createdInvoice);
      mockEm.save.mockResolvedValue(createdInvoice);

      const result = await resolver.createInvoice(mockContext, createInput);

      expect(result).toEqual(makeInvoiceDto(createdInvoice));
      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEm.create).toHaveBeenCalledWith(Invoice, {
        ...createInput,
        userId, // ← o resolver passa userId para o create
        status: InvoiceStatusEnum.ACTIVE,
        paidInstallments: 0,
        balance: "150.00",
        total: "150.00",
      });
      expect(mockedClearDecimal).toHaveBeenCalledWith("150.00");
      expect(mockedClearDecimal).toHaveBeenCalledTimes(2);
      expect(mockEm.save).toHaveBeenCalledWith(createdInvoice);
    });

    it("deve lançar erro se a criação falhar", async () => {
      mockEm.create.mockReturnValue({});
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.createInvoice(mockContext, createInput)
      ).rejects.toThrow("Failed to create invoice.");

      expect(mockedLoggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
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

      const inputParcial: UpdateInvoiceInput = { name: undefined };

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
  // invoicePaymentOrRefund
  // ============================================================
  describe("invoicePaymentOrRefund", () => {
    const payInput: InvoicePayInput = {
      id: invoiceId,
      bankId: bankId,
      payInvoice: true,
      isRefund: false,
    };

    const refundInput: InvoicePayInput = {
      id: invoiceId,
      bankId: bankId,
      payInvoice: false,
      isRefund: true,
    };

    it("deve processar pagamento com sucesso", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({
        bank: mockBank,
        bankId: mockBank.id,
        installments: 3,
        paidInstallments: 0,
        status: InvoiceStatusEnum.ACTIVE,
      });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockResolvedValue(mockInvoiceWithBank);

      const result = await resolver.invoicePaymentOrRefund(
        mockContext,
        payInput
      );

      expect(result).toEqual(makeInvoiceDto(mockInvoiceWithBank));
      expect(mockInvoiceWithBank.paidInstallments).toBe(1);
      expect(mockInvoiceWithBank.status).toBe(InvoiceStatusEnum.ACTIVE);
      expect(mockEm.save).toHaveBeenCalledWith(mockInvoiceWithBank);
    });

    it("deve marcar como COMPLETED quando todas as parcelas são pagas", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({
        bank: mockBank,
        bankId: mockBank.id,
        installments: 1,
        paidInstallments: 0,
        status: InvoiceStatusEnum.ACTIVE,
      });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockResolvedValue(mockInvoiceWithBank);

      await resolver.invoicePaymentOrRefund(mockContext, payInput);

      expect(mockInvoiceWithBank.paidInstallments).toBe(1);
      expect(mockInvoiceWithBank.status).toBe(InvoiceStatusEnum.COMPLETED);
    });

    it("deve processar reembolso com sucesso", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({
        bank: mockBank,
        bankId: mockBank.id,
        installments: 3,
        paidInstallments: 2,
        status: InvoiceStatusEnum.ACTIVE,
      });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockResolvedValue(mockInvoiceWithBank);

      await resolver.invoicePaymentOrRefund(mockContext, refundInput);

      expect(mockInvoiceWithBank.paidInstallments).toBe(1);
      expect(mockInvoiceWithBank.status).toBe(InvoiceStatusEnum.REFUNDED);
    });

    it("deve decrementar paidInstallments no reembolso", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({
        bank: mockBank,
        bankId: mockBank.id,
        installments: 5,
        paidInstallments: 3,
        status: InvoiceStatusEnum.ACTIVE,
      });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockResolvedValue(mockInvoiceWithBank);

      await resolver.invoicePaymentOrRefund(mockContext, refundInput);

      expect(mockInvoiceWithBank.paidInstallments).toBe(2);
    });

    it("deve lançar erro se payInvoice e isRefund forem ambos true", async () => {
      const invalidInput: InvoicePayInput = {
        id: invoiceId,
        bankId: bankId,
        payInvoice: true,
        isRefund: true,
      };

      await expect(
        resolver.invoicePaymentOrRefund(mockContext, invalidInput)
      ).rejects.toThrow(
        "You cannot pay and refund the same invoice at the same time."
      );

      expect(mockEm.findOne).not.toHaveBeenCalled();
    });

    it("deve lançar erro se payInvoice e isRefund forem ambos false", async () => {
      const invalidInput: InvoicePayInput = {
        id: invoiceId,
        bankId: bankId,
        payInvoice: false,
        isRefund: false,
      };

      await expect(
        resolver.invoicePaymentOrRefund(mockContext, invalidInput)
      ).rejects.toThrow(
        "You cannot pay and refund the same invoice at the same time."
      );

      expect(mockEm.findOne).not.toHaveBeenCalled();
    });

    it("deve lançar erro se a fatura não for encontrada", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.invoicePaymentOrRefund(mockContext, payInput)
      ).rejects.toThrow(INVOICE_NOT_FOUND);
    });

    it("deve lançar erro se o banco não pertencer ao usuário", async () => {
      const mockBank = makeMockBank({ userId: "user-different" });
      const mockInvoiceWithBank = makeMockInvoice({ bank: mockBank });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);

      await expect(
        resolver.invoicePaymentOrRefund(mockContext, payInput)
      ).rejects.toThrow(USER_BANK_NOT_MATCH);
    });

    it("deve lançar erro se a operação falhar", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({ bank: mockBank });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.invoicePaymentOrRefund(mockContext, payInput)
      ).rejects.toThrow("Failed to process invoice payment.");
    });

    it("deve lançar erro específico para refund quando a operação falhar", async () => {
      const mockBank = makeMockBank({ userId });
      const mockInvoiceWithBank = makeMockInvoice({ bank: mockBank });

      mockEm.findOne.mockResolvedValue(mockInvoiceWithBank);
      mockEm.save.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.invoicePaymentOrRefund(mockContext, refundInput)
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

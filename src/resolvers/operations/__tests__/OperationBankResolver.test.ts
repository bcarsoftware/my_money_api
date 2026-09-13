import "reflect-metadata";

import { validate } from "class-validator";

import {
  BALANCE_INVALID,
  BANK_BOX_NOT_FOUND,
  INSUFFICIENT_BALANCE,
  INVOICE_NOT_FOUND,
  OPERATION_BANK_INVALID_BALANCE_TO_BANK_BOX,
  OPERATION_NOT_FOUND,
  USER_BANK_NOT_MATCH,
  USER_NOT_AUTHENTICATED,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { Bank } from "@/entities/Bank";
import { BankBox } from "@/entities/BankBox";
import { Invoice } from "@/entities/Invoice";
import { OperationBank } from "@/entities/OperationBank";
import { InvoiceStatusEnum } from "@/enums/InvoiceStatusEnum";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { OperationError } from "@/errors/OperationError";
import { OperationBankResolver } from "@/resolvers/operations/OperationBankResolver";
import { toOperationBankDto } from "@/resolvers/operations/dtos/toOperationBankDto";
import {
  CreateOperationBankInput,
  ListOperationBankInput,
  UpdateOperationBankInput,
} from "@/resolvers/operations/inputs/OperationBankInputs";
import { generalQueryFilter } from "@/resolvers/operations/utils/generalQueryFilter";
import {
  balanceCurrencyVerify,
  uuidFourVerify,
} from "@/resolvers/operations/utils/operationUtils";
import {
  clearDecimal,
  decimalGreaterThan,
  decimalMultiply,
  decimalSubtract,
  decimalSum,
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
jest.mock("@/resolvers/operations/dtos/toOperationBankDto");
jest.mock("@/resolvers/operations/utils/generalQueryFilter");
jest.mock("@/resolvers/operations/utils/operationUtils");
jest.mock("@/utils/verifiers/decorators/Protected", () => ({
  Protected: () => () => {},
}));
jest.mock("class-validator", () => ({
  ...jest.requireActual("class-validator"),
  validate: jest.fn(),
}));

const mockedLoggedContext = jest.mocked(loggedContext);
const mockedToOperationBankDto = jest.mocked(toOperationBankDto);
const mockedGeneralQueryFilter = jest.mocked(generalQueryFilter);
const mockedBalanceCurrencyVerify = jest.mocked(balanceCurrencyVerify);
const mockedUuidFourVerify = jest.mocked(uuidFourVerify);
const mockedClearDecimal = jest.mocked(clearDecimal);
const mockedDecimalGreaterThan = jest.mocked(decimalGreaterThan);
const mockedDecimalMultiply = jest.mocked(decimalMultiply);
const mockedDecimalSubtract = jest.mocked(decimalSubtract);
const mockedDecimalSum = jest.mocked(decimalSum);
const mockedDecimalSumSequence = jest.mocked(decimalSumSequence);
const mockedRandomUUID = jest.mocked(randomUUID);
const mockedValidate = jest.mocked(validate);

// ============================================================
// Helpers
// ============================================================
const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID_2 = "550e8400-e29b-41d4-a716-446655440001";
const UUID_3 = "550e8400-e29b-41d4-a716-446655440002";

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
    // em.create(Entity, data) devolve o próprio data (facilita inspecionar depois)
    create: jest.fn((_entity: unknown, data: unknown) => data),
    // em.save(Entity, entity) devolve o entity; quando chamado só com (entity), devolve o arg
    save: jest.fn(async (arg1: unknown, arg2?: unknown) => arg2 ?? arg1),
    softRemove: jest.fn(),
  };
}

// As entidades agora são objetos simples: o resolver usa em.save(Entity, entity),
// então não precisamos mais injetar `save` nas instâncias.
function makeBank(overrides: Partial<Bank> = {}): Bank {
  return {
    id: UUID,
    userId: "user-1",
    name: "Banco X",
    balance: "1000.00",
    creditLimit: "5000.00",
    actualLimit: "5000.00",
    ...overrides,
  } as Bank;
}

function makeBankBox(overrides: Partial<BankBox> = {}): BankBox {
  return {
    id: UUID_2,
    bankId: UUID,
    balance: "500.00",
    ...overrides,
  } as BankBox;
}

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: UUID_3,
    bankId: UUID,
    status: InvoiceStatusEnum.ACTIVE,
    installments: 3,
    paidInstallments: 1,
    balance: "100.00",
    ...overrides,
  } as Invoice;
}

function makeOperation(overrides: Partial<OperationBank> = {}): OperationBank {
  return {
    id: "op-1",
    userId: "user-1",
    bankId: UUID,
    balance: "100.00",
    tag: "Original",
    description: "Descrição original",
    ...overrides,
  } as OperationBank;
}

function makeOperationDto(overrides: Record<string, unknown> = {}) {
  return {
    id: "op-1",
    userId: "user-1",
    bankId: UUID,
    balance: "100.00",
    tag: "Tag",
    description: "Descrição",
    ...overrides,
  };
}

const makeCreateInput = (
  overrides: Partial<CreateOperationBankInput> = {}
): CreateOperationBankInput =>
  ({
    bankId: UUID,
    balance: "100.00",
    discount: null,
    forfeit: null,
    typeOperation: OperationEnum.DEPOSIT,
    local: LocalEnum.EXTERNAL,
    tag: "Tag padrão",
    description: "Descrição padrão",
    ...overrides,
  }) as CreateOperationBankInput;

// ============================================================
// Suite
// ============================================================
describe("OperationBankResolver", () => {
  let resolver: OperationBankResolver;
  let mockEm: MockEntityManager;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    resolver = new OperationBankResolver();
    mockEm = createMockEm();

    mockedLoggedContext.mockImplementation(async (_ctx, callback) =>
      callback(mockEm as unknown as Parameters<typeof callback>[0])
    );

    mockedToOperationBankDto.mockImplementation(
      (op) =>
        makeOperationDto(
          op as unknown as Record<string, unknown>
        ) as ReturnType<typeof toOperationBankDto>
    );

    mockedGeneralQueryFilter.mockReturnValue(
      {} as ReturnType<typeof generalQueryFilter>
    );
    mockedBalanceCurrencyVerify.mockReturnValue(true);
    mockedUuidFourVerify.mockReturnValue(true);
    mockedClearDecimal.mockImplementation((v) => v);
    mockedDecimalGreaterThan.mockReturnValue(false);
    mockedDecimalMultiply.mockReturnValue("100.00");
    mockedDecimalSubtract.mockReturnValue("900.00");
    mockedDecimalSum.mockReturnValue("1100.00");
    mockedDecimalSumSequence.mockReturnValue("100.00");
    mockedRandomUUID.mockReturnValue("reg-uuid-1234");
    mockedValidate.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // operationBankList
  // ============================================================
  describe("operationBankList", () => {
    const listInput: ListOperationBankInput = {
      bankId: UUID,
      limit: 10,
      offset: 5,
    } as ListOperationBankInput;

    it("retorna lista paginada com filtros padrão", async () => {
      const operations = [makeOperation()];
      mockEm.findAndCount.mockResolvedValue([operations, 1]);

      const result = await resolver.operationBankList(makeContext(), listInput);

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        OperationBank,
        expect.objectContaining({
          where: expect.objectContaining({ userId: "user-1", bankId: UUID }),
          take: 10,
          skip: 5,
          order: { createdAt: "DESC" },
        })
      );
    });

    it("usa limit 20 e offset 0 quando não informados", async () => {
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.operationBankList(makeContext(), {
        bankId: UUID,
      } as ListOperationBankInput);

      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        OperationBank,
        expect.objectContaining({ take: 20, skip: 0 })
      );
    });

    it("aplica filtro de bankBoxId quando fornecido", async () => {
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.operationBankList(makeContext(), {
        bankId: UUID,
        bankBoxId: UUID_2,
      } as ListOperationBankInput);

      const [, options] = mockEm.findAndCount.mock.calls[0];
      expect(options.where.bankBoxId).toBe(UUID_2);
    });

    it("aplica filtro de invoiceId quando fornecido", async () => {
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.operationBankList(makeContext(), {
        bankId: UUID,
        invoiceId: UUID_3,
      } as ListOperationBankInput);

      const [, options] = mockEm.findAndCount.mock.calls[0];
      expect(options.where.invoiceId).toBe(UUID_3);
    });

    it("aplica generalQueryFilter quando retornar algo", async () => {
      mockedGeneralQueryFilter.mockReturnValue({
        typeOperation: OperationEnum.PIX,
      } as ReturnType<typeof generalQueryFilter>);
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.operationBankList(makeContext(), {
        bankId: UUID,
      } as ListOperationBankInput);

      const [, options] = mockEm.findAndCount.mock.calls[0];
      expect(options.where.typeOperation).toBe(OperationEnum.PIX);
    });

    it("lança USER_NOT_AUTHENTICATED quando não há userId", async () => {
      await expect(
        resolver.operationBankList(
          makeContext({ userId: undefined }),
          listInput
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("propaga erro genérico quando a consulta falha", async () => {
      mockEm.findAndCount.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.operationBankList(makeContext(), listInput)
      ).rejects.toThrow("Failed to fetch operation bank list.");
    });
  });

  // ============================================================
  // operationBankUpdate
  // ============================================================
  describe("operationBankUpdate", () => {
    const updateInput: UpdateOperationBankInput = {
      tag: "Nova tag",
      description: "Nova descrição",
    } as UpdateOperationBankInput;

    it("atualiza os campos fornecidos, salva via em.save e retorna o DTO", async () => {
      const operation = makeOperation();
      mockEm.findOne.mockResolvedValue(operation);

      const result = await resolver.operationBankUpdate(
        makeContext(),
        "op-1",
        updateInput
      );

      expect(operation.tag).toBe("Nova tag");
      expect(operation.description).toBe("Nova descrição");
      expect(mockEm.save).toHaveBeenCalledWith(OperationBank, operation);
      expect(result).toBeDefined();
    });

    it("ignora campos undefined (mantém originais)", async () => {
      const operation = makeOperation({
        tag: "Original",
        description: "Desc",
      });
      mockEm.findOne.mockResolvedValue(operation);

      await resolver.operationBankUpdate(
        makeContext(),
        "op-1",
        {} as UpdateOperationBankInput
      );

      expect(operation.tag).toBe("Original");
      expect(operation.description).toBe("Desc");
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationBankUpdate(
          makeContext({ userId: undefined }),
          "op-1",
          updateInput
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança OPERATION_NOT_FOUND quando operação não existe", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.operationBankUpdate(
          makeContext(),
          "op-inexistente",
          updateInput
        )
      ).rejects.toThrow(OPERATION_NOT_FOUND);
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const operation = makeOperation();
      mockEm.findOne.mockResolvedValue(operation);
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationBankUpdate(makeContext(), "op-1", updateInput)
      ).rejects.toThrow("Failed to update operation bank.");
    });
  });

  // ============================================================
  // operationBankDeposit
  // ============================================================
  describe("operationBankDeposit", () => {
    it("cria operação, soma ao saldo do banco e retorna DTO", async () => {
      const bank = makeBank({ balance: "1000.00" });
      mockEm.findOne.mockResolvedValue(bank);

      const result = await resolver.operationBankDeposit(
        makeContext(),
        UUID,
        "100.00"
      );

      expect(bank.balance).toBe("1100.00");
      expect(mockEm.save).toHaveBeenCalledWith(
        OperationBank,
        expect.objectContaining({
          bankId: UUID,
          balance: "100.00",
          typeOperation: OperationEnum.DEPOSIT,
          local: LocalEnum.EXTERNAL,
          operationRegister: "reg-uuid-1234",
        })
      );
      expect(mockEm.save).toHaveBeenCalledWith(Bank, bank);
      expect(result).toBeDefined();
    });

    it("lança BALANCE_INVALID quando formato inválido", async () => {
      mockedBalanceCurrencyVerify.mockReturnValue(false);

      await expect(
        resolver.operationBankDeposit(makeContext(), UUID, "invalido")
      ).rejects.toThrow(BALANCE_INVALID);
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationBankDeposit(
          makeContext({ userId: undefined }),
          UUID,
          "100.00"
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança erro quando bankId não é UUID", async () => {
      mockedUuidFourVerify.mockReturnValue(false);

      await expect(
        resolver.operationBankDeposit(makeContext(), "nao-uuid", "100.00")
      ).rejects.toThrow("Bank ID is not a valid UUID.");
    });

    it("lança USER_BANK_NOT_MATCH quando banco não pertence ao usuário", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.operationBankDeposit(makeContext(), UUID, "100.00")
      ).rejects.toThrow(USER_BANK_NOT_MATCH);
    });

    it("lança OperationError quando validate do input retorna erros", async () => {
      const bank = makeBank();
      mockEm.findOne.mockResolvedValue(bank);
      mockedValidate.mockResolvedValueOnce([{ property: "balance" }] as never);

      await expect(
        resolver.operationBankDeposit(makeContext(), UUID, "100.00")
      ).rejects.toBeInstanceOf(OperationError);
    });

    it("lança OperationError quando validate do BankDepositVerify retorna erros", async () => {
      const bank = makeBank();
      mockEm.findOne.mockResolvedValue(bank);
      mockedValidate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ property: "amount" }] as never);

      await expect(
        resolver.operationBankDeposit(makeContext(), UUID, "100.00")
      ).rejects.toBeInstanceOf(OperationError);
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const bank = makeBank();
      mockEm.findOne.mockResolvedValue(bank);
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationBankDeposit(makeContext(), UUID, "100.00")
      ).rejects.toThrow("Failed to deposit to bank.");
    });
  });

  // ============================================================
  // operationBankWithdraw
  // ============================================================
  describe("operationBankWithdraw", () => {
    it("cria operação, soma ao saldo e retorna DTO", async () => {
      const bank = makeBank({ balance: "1000.00" });
      mockEm.findOne.mockResolvedValue(bank);

      const result = await resolver.operationBankWithdraw(
        makeContext(),
        UUID,
        "100.00"
      );

      expect(mockEm.save).toHaveBeenCalledWith(
        OperationBank,
        expect.objectContaining({
          typeOperation: OperationEnum.WITHDRAW,
          local: LocalEnum.EXTERNAL,
        })
      );
      expect(mockEm.save).toHaveBeenCalledWith(Bank, bank);
      expect(result).toBeDefined();
    });

    it("lança INSUFFICIENT_BALANCE quando valor excede o saldo disponível", async () => {
      const bank = makeBank({ balance: "50.00" });
      mockEm.findOne.mockResolvedValue(bank);
      mockedDecimalMultiply.mockReturnValueOnce("-100.00");
      mockedDecimalGreaterThan.mockReturnValueOnce(true);

      await expect(
        resolver.operationBankWithdraw(makeContext(), UUID, "100.00")
      ).rejects.toThrow(INSUFFICIENT_BALANCE);
    });

    it("lança BALANCE_INVALID para formato inválido", async () => {
      mockedBalanceCurrencyVerify.mockReturnValue(false);

      await expect(
        resolver.operationBankWithdraw(makeContext(), UUID, "invalido")
      ).rejects.toThrow(BALANCE_INVALID);
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationBankWithdraw(
          makeContext({ userId: undefined }),
          UUID,
          "100.00"
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança USER_BANK_NOT_MATCH quando banco não pertence ao usuário", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.operationBankWithdraw(makeContext(), UUID, "100.00")
      ).rejects.toThrow(USER_BANK_NOT_MATCH);
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const bank = makeBank();
      mockEm.findOne.mockResolvedValue(bank);
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationBankWithdraw(makeContext(), UUID, "100.00")
      ).rejects.toThrow("Failed to withdraw from bank.");
    });
  });

  // ============================================================
  // operationBankTransfer
  // ============================================================
  describe("operationBankTransfer", () => {
    it("cria 2 operações em transferência interna entre bancos", async () => {
      const originBank = makeBank({ id: UUID, balance: "1000.00" });
      const destinationBank = makeBank({ id: UUID_2, balance: "500.00" });

      mockEm.findOne
        .mockResolvedValueOnce(originBank)
        .mockResolvedValueOnce(destinationBank);

      const result = await resolver.operationBankTransfer(
        makeContext(),
        "100.00",
        OperationEnum.TRANSFER,
        UUID,
        UUID_2
      );

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
      // 2 em.save(Bank, ...) + 2 em.save(OperationBank, ...)
      expect(mockEm.save).toHaveBeenCalledTimes(4);
      expect(mockEm.save).toHaveBeenCalledWith(Bank, originBank);
      expect(mockEm.save).toHaveBeenCalledWith(Bank, destinationBank);
    });

    it("cria 1 operação quando destinationBankId é omitido (envio externo)", async () => {
      const originBank = makeBank({ balance: "1000.00" });
      mockEm.findOne.mockResolvedValueOnce(originBank);

      const result = await resolver.operationBankTransfer(
        makeContext(),
        "100.00",
        OperationEnum.TRANSFER,
        UUID
      );

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(mockEm.save).toHaveBeenCalledWith(Bank, originBank);
    });

    it("lança BALANCE_INVALID quando formato inválido", async () => {
      mockedBalanceCurrencyVerify.mockReturnValue(false);

      await expect(
        resolver.operationBankTransfer(
          makeContext(),
          "invalido",
          OperationEnum.TRANSFER,
          UUID
        )
      ).rejects.toThrow(BALANCE_INVALID);
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationBankTransfer(
          makeContext({ userId: undefined }),
          "100.00",
          OperationEnum.TRANSFER,
          UUID
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança erro quando originBankId não é UUID", async () => {
      mockedUuidFourVerify.mockReturnValueOnce(false);

      await expect(
        resolver.operationBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          "nao-uuid"
        )
      ).rejects.toThrow("Origin Bank ID is not a valid UUID.");
    });

    it("lança erro quando destinationBankId não é UUID", async () => {
      mockedUuidFourVerify.mockReturnValueOnce(true).mockReturnValueOnce(false);

      await expect(
        resolver.operationBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          UUID,
          "nao-uuid"
        )
      ).rejects.toThrow("Destination Bank ID is not a valid UUID.");
    });

    it("lança OperationError quando validate do transfer falha", async () => {
      mockedValidate.mockResolvedValueOnce([{ property: "amount" }] as never);

      await expect(
        resolver.operationBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          UUID
        )
      ).rejects.toBeInstanceOf(OperationError);
    });

    it("lança erro quando banco de origem não existe", async () => {
      mockEm.findOne.mockResolvedValueOnce(null);

      await expect(
        resolver.operationBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          UUID
        )
      ).rejects.toThrow("Origin bank not found.");
    });

    it("lança erro quando banco de destino não existe em transferência interna", async () => {
      const originBank = makeBank({ id: UUID });
      mockEm.findOne
        .mockResolvedValueOnce(originBank)
        .mockResolvedValueOnce(null);

      await expect(
        resolver.operationBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          UUID,
          UUID_2
        )
      ).rejects.toThrow("Destination bank not found.");
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const originBank = makeBank();
      mockEm.findOne.mockResolvedValueOnce(originBank);
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          UUID
        )
      ).rejects.toThrow("Failed to complete bank operation transfer.");
    });
  });

  // ============================================================
  // operationBankPayInvoice
  // ============================================================
  describe("operationBankPayInvoice", () => {
    const validInput: CreateOperationBankInput = makeCreateInput({
      local: LocalEnum.INTERNAL,
      invoiceId: UUID_3,
      typeOperation: OperationEnum.PAYMENT,
    });

    beforeEach(() => {
      // Neste bloco precisamos de operações realistas para checar saldos e parcelas
      mockedDecimalSum.mockImplementation((a: string, b: string) =>
        (Number(a) + Number(b)).toFixed(2)
      );
      mockedDecimalSubtract.mockImplementation((a: string, b: string) =>
        (Number(a) - Number(b)).toFixed(2)
      );
    });

    it("cria operação, atualiza banco e fatura, e retorna DTO", async () => {
      const bank = makeBank({ balance: "1000.00", creditLimit: "5000.00" });
      const invoice = makeInvoice({
        installments: 3,
        paidInstallments: 0,
      });
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(invoice);

      const result = await resolver.operationBankPayInvoice(makeContext(), {
        ...validInput,
      });

      // Banco teve o valor descontado
      expect(bank.balance).toBe("900.00");

      // paidInstallments incrementou (não installments)
      expect(invoice.paidInstallments).toBe(1);
      expect(invoice.installments).toBe(3); // permanece inalterado

      expect(mockEm.save).toHaveBeenCalledWith(Bank, bank);
      expect(mockEm.save).toHaveBeenCalledWith(Invoice, invoice);
      expect(mockEm.save).toHaveBeenCalledWith(
        OperationBank,
        expect.any(Object)
      );
      expect(result).toBeDefined();
    });

    it("incrementa paidInstallments em cada pagamento", async () => {
      const bank = makeBank();
      const invoice = makeInvoice({
        installments: 5,
        paidInstallments: 2,
      });
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(invoice);

      await resolver.operationBankPayInvoice(makeContext(), { ...validInput });

      expect(invoice.paidInstallments).toBe(3);
      expect(invoice.installments).toBe(5);
    });

    it("marca fatura como COMPLETED quando paidInstallments alcança installments", async () => {
      const bank = makeBank();
      const invoice = makeInvoice({
        installments: 3,
        paidInstallments: 2, // último pagamento → vira 3
      });
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(invoice);

      await resolver.operationBankPayInvoice(makeContext(), { ...validInput });

      expect(invoice.paidInstallments).toBe(3);
      expect(invoice.status).toBe(InvoiceStatusEnum.COMPLETED);
    });

    it("NÃO marca como COMPLETED quando ainda faltam parcelas", async () => {
      const bank = makeBank();
      const invoice = makeInvoice({
        installments: 5,
        paidInstallments: 1,
        status: InvoiceStatusEnum.ACTIVE,
      });
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(invoice);

      await resolver.operationBankPayInvoice(makeContext(), { ...validInput });

      expect(invoice.paidInstallments).toBe(2);
      expect(invoice.status).toBe(InvoiceStatusEnum.ACTIVE);
    });

    it("lança erro quando local não é INTERNAL", async () => {
      await expect(
        resolver.operationBankPayInvoice(makeContext(), {
          ...validInput,
          local: LocalEnum.EXTERNAL,
        })
      ).rejects.toThrow("Operation bank payment invoice must be INTERNAL.");
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationBankPayInvoice(makeContext({ userId: undefined }), {
          ...validInput,
        })
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança OperationError quando validate falha", async () => {
      mockedValidate.mockResolvedValueOnce([{ property: "amount" }] as never);

      await expect(
        resolver.operationBankPayInvoice(makeContext(), { ...validInput })
      ).rejects.toBeInstanceOf(OperationError);
    });

    it("lança erro quando invoiceId ausente", async () => {
      const input = { ...validInput, invoiceId: undefined };

      await expect(
        resolver.operationBankPayInvoice(makeContext(), input)
      ).rejects.toThrow(
        "Invoice ID must be provided for bank invoice operation."
      );
    });

    it("lança erro quando invoiceId não é UUID", async () => {
      mockedUuidFourVerify.mockReturnValueOnce(false);

      await expect(
        resolver.operationBankPayInvoice(makeContext(), {
          ...validInput,
          invoiceId: "nao-uuid",
        })
      ).rejects.toThrow("Invoice ID must be a valid UUID.");
    });

    it("lança USER_BANK_NOT_MATCH quando banco não existe", async () => {
      mockEm.findOne.mockResolvedValueOnce(null);

      await expect(
        resolver.operationBankPayInvoice(makeContext(), { ...validInput })
      ).rejects.toThrow(USER_BANK_NOT_MATCH);
    });

    it("lança INVOICE_NOT_FOUND quando fatura não existe", async () => {
      const bank = makeBank();
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(null);

      await expect(
        resolver.operationBankPayInvoice(makeContext(), { ...validInput })
      ).rejects.toThrow(INVOICE_NOT_FOUND);
    });

    it("lança erro quando fatura já está COMPLETED", async () => {
      const bank = makeBank();
      const invoice = makeInvoice({ status: InvoiceStatusEnum.COMPLETED });
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(invoice);

      await expect(
        resolver.operationBankPayInvoice(makeContext(), { ...validInput })
      ).rejects.toThrow("Invoice has already been completed.");
    });

    it("lança INSUFFICIENT_BALANCE quando valor excede saldo do banco", async () => {
      const bank = makeBank({ balance: "10.00" });
      const invoice = makeInvoice();
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(invoice);
      mockedDecimalGreaterThan.mockReturnValueOnce(true);

      await expect(
        resolver.operationBankPayInvoice(makeContext(), { ...validInput })
      ).rejects.toThrow(INSUFFICIENT_BALANCE);
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const bank = makeBank();
      const invoice = makeInvoice();
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(invoice);
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationBankPayInvoice(makeContext(), { ...validInput })
      ).rejects.toThrow("Failed to complete bank invoice paymeent.");
    });
  });

  // ============================================================
  // operationBankToBankBox
  // ============================================================
  describe("operationBankToBankBox", () => {
    const withdrawInput: CreateOperationBankInput = makeCreateInput({
      typeOperation: OperationEnum.WITHDRAW,
      local: LocalEnum.INTERNAL,
      bankBoxId: UUID_2,
      balance: "-100.00",
    });

    const depositInput: CreateOperationBankInput = makeCreateInput({
      typeOperation: OperationEnum.DEPOSIT,
      local: LocalEnum.INTERNAL,
      bankBoxId: UUID_2,
      balance: "100.00",
    });

    beforeEach(() => {
      // Neste bloco queremos somas e multiplicações realistas para travar o saldo real
      mockedDecimalSum.mockImplementation((a: string, b: string) =>
        (Number(a) + Number(b)).toFixed(2)
      );
      mockedDecimalMultiply.mockImplementation((a: string, b: string) =>
        (Number(a) * Number(b)).toFixed(2)
      );
    });

    it("processa WITHDRAW com balance negativo (box saca, banco compensa)", async () => {
      const bank = makeBank({ balance: "1000.00" });
      const bankBox = makeBankBox({ balance: "500.00" });
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(bankBox);

      // 1ª: isNegative = decimalGreaterThan("0.00", "-100.00") → true (passa do switch)
      // 2ª: saldo = decimalGreaterThan("100.00", "500.00") → false (passa)
      mockedDecimalGreaterThan
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const result = await resolver.operationBankToBankBox(makeContext(), {
        ...withdrawInput,
      });

      expect(bankBox.balance).toBe("400.00");
      expect(bank.balance).toBe("1100.00");
      expect(mockEm.save).toHaveBeenCalledWith(
        OperationBank,
        expect.any(Object)
      );
      expect(result).toBeDefined();
    });

    it("processa DEPOSIT com balance positivo (box deposita, banco cede)", async () => {
      const bank = makeBank({ balance: "1000.00" });
      const bankBox = makeBankBox({ balance: "500.00" });
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(bankBox);

      // 1ª: isNegative = decimalGreaterThan("0.00", "100.00") → false (passa)
      // 2ª: saldo = decimalGreaterThan("100.00", "1000.00") → false (passa)
      mockedDecimalGreaterThan
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false);

      const result = await resolver.operationBankToBankBox(makeContext(), {
        ...depositInput,
      });

      expect(bankBox.balance).toBe("600.00");
      expect(bank.balance).toBe("900.00");
      expect(mockEm.save).toHaveBeenCalledWith(
        OperationBank,
        expect.any(Object)
      );
      expect(result).toBeDefined();
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationBankToBankBox(makeContext({ userId: undefined }), {
          ...withdrawInput,
        })
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança OperationError quando validate do bankBox falha", async () => {
      mockedValidate.mockResolvedValueOnce([{ property: "balance" }] as never);

      await expect(
        resolver.operationBankToBankBox(makeContext(), { ...withdrawInput })
      ).rejects.toBeInstanceOf(OperationError);
    });

    it("lança OPERATION_BANK_INVALID_BALANCE_TO_BANK_BOX para WITHDRAW com balance positivo", async () => {
      // 1ª chamada: isNegative = false (balance positivo, mas typeOperation é WITHDRAW)
      mockedDecimalGreaterThan.mockReturnValueOnce(false);

      await expect(
        resolver.operationBankToBankBox(makeContext(), {
          ...withdrawInput,
          balance: "100.00",
        })
      ).rejects.toThrow(OPERATION_BANK_INVALID_BALANCE_TO_BANK_BOX);
    });

    it("lança OPERATION_BANK_INVALID_BALANCE_TO_BANK_BOX para DEPOSIT com balance negativo", async () => {
      // 1ª chamada: isNegative = true (balance negativo, mas typeOperation é DEPOSIT)
      mockedDecimalGreaterThan.mockReturnValueOnce(true);

      await expect(
        resolver.operationBankToBankBox(makeContext(), {
          ...depositInput,
          balance: "-100.00",
        })
      ).rejects.toThrow(OPERATION_BANK_INVALID_BALANCE_TO_BANK_BOX);
    });

    it("lança USER_BANK_NOT_MATCH quando banco não existe", async () => {
      mockEm.findOne.mockResolvedValueOnce(null);
      // 1ª: isNegative (WITHDRAW) → true; 2ª chamada nunca ocorre (banco nulo)
      mockedDecimalGreaterThan.mockReturnValueOnce(true);

      await expect(
        resolver.operationBankToBankBox(makeContext(), { ...withdrawInput })
      ).rejects.toThrow(USER_BANK_NOT_MATCH);
    });

    it("lança BANK_BOX_NOT_FOUND quando bankBox não existe", async () => {
      const bank = makeBank();
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(null);
      mockedDecimalGreaterThan.mockReturnValueOnce(true);

      await expect(
        resolver.operationBankToBankBox(makeContext(), { ...withdrawInput })
      ).rejects.toThrow(BANK_BOX_NOT_FOUND);
    });

    it("lança INSUFFICIENT_BALANCE em WITHDRAW quando o valor excede o saldo do bank box", async () => {
      const bank = makeBank({ balance: "1000.00" });
      const bankBox = makeBankBox({ balance: "50.00" });
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(bankBox);

      // 1ª: isNegative = true
      // 2ª: saldo = decimalGreaterThan("100.00", "50.00") → true (dispara)
      mockedDecimalGreaterThan
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      await expect(
        resolver.operationBankToBankBox(makeContext(), { ...withdrawInput })
      ).rejects.toThrow(INSUFFICIENT_BALANCE);

      expect(mockEm.save).not.toHaveBeenCalled();
    });

    it("lança INSUFFICIENT_BALANCE em DEPOSIT quando o valor excede o saldo do banco", async () => {
      const bank = makeBank({ balance: "50.00" });
      const bankBox = makeBankBox({ balance: "500.00" });
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(bankBox);

      // 1ª: isNegative = false
      // 2ª: saldo = decimalGreaterThan("100.00", "50.00") → true (dispara)
      mockedDecimalGreaterThan
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      await expect(
        resolver.operationBankToBankBox(makeContext(), { ...depositInput })
      ).rejects.toThrow(INSUFFICIENT_BALANCE);

      expect(mockEm.save).not.toHaveBeenCalled();
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const bank = makeBank({ balance: "1000.00" });
      const bankBox = makeBankBox({ balance: "500.00" });
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(bankBox);

      // Passa dos dois switches
      mockedDecimalGreaterThan
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationBankToBankBox(makeContext(), { ...withdrawInput })
      ).rejects.toThrow("Failed to complete bank to bank box operation.");
    });
  });
});

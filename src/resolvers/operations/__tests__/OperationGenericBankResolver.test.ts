import "reflect-metadata";

import { validate } from "class-validator";

import {
  BALANCE_MUST_BE_POSITIVE,
  GENERIC_BANK_BOX_NOT_FOUND,
  GENERIC_BANK_BOX_REQUIRED,
  GENERIC_BANK_NOT_FOUND,
  INSUFFICIENT_BALANCE,
  OPERATION_NOT_FOUND,
  OPERATION_TYPE_INVALID,
  USER_NOT_AUTHENTICATED,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { GenericBank } from "@/entities/GenericBank";
import { GenericBankBox } from "@/entities/GenericBankBox";
import { OperationGenericBank } from "@/entities/OperationGenericBank";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { OperationError } from "@/errors/OperationError";
import { OperationGenericBankResolver } from "@/resolvers/operations/OperationGenericBankResolver";
import { toOperationGenericBankDto } from "@/resolvers/operations/dtos/toOperationGenericBankDto";
import {
  CreateOperationGenericBankInput,
  ListOperationGenericBankInput,
  UpdateOperationGenericBankInput,
} from "@/resolvers/operations/inputs/OperationGenericBankInputs";
import { generalQueryFilter } from "@/resolvers/operations/utils/generalQueryFilter";
import { uuidFourVerify } from "@/resolvers/operations/utils/operationUtils";
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
jest.mock("@/resolvers/operations/dtos/toOperationGenericBankDto");
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
const mockedToOperationGenericBankDto = jest.mocked(toOperationGenericBankDto);
const mockedGeneralQueryFilter = jest.mocked(generalQueryFilter);
const mockedUuidFourVerify = jest.mocked(uuidFourVerify);
const mockedClearDecimal = jest.mocked(clearDecimal);
const mockedDecimalGreaterThan = jest.mocked(decimalGreaterThan);
const mockedDecimalMultiply = jest.mocked(decimalMultiply);
const mockedDecimalSum = jest.mocked(decimalSum);
const mockedRandomUUID = jest.mocked(randomUUID);
const mockedValidate = jest.mocked(validate);

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

function makeGenericBank(overrides: Partial<GenericBank> = {}): GenericBank {
  return {
    id: UUID,
    userId: "user-1",
    name: "Banco Genérico",
    balance: "1000.00",
    ...overrides,
  } as GenericBank;
}

function makeGenericBankBox(
  overrides: Partial<GenericBankBox> = {}
): GenericBankBox {
  return {
    id: UUID_2,
    genericBankId: UUID,
    balance: "500.00",
    ...overrides,
  } as GenericBankBox;
}

function makeOperation(
  overrides: Partial<OperationGenericBank> = {}
): OperationGenericBank {
  return {
    id: "op-1",
    userId: "user-1",
    genericBankId: UUID,
    balance: "100.00",
    tag: "Original",
    description: "Descrição original",
    ...overrides,
  } as OperationGenericBank;
}

function makeOperationDto(overrides: Record<string, unknown> = {}) {
  return {
    id: "op-1",
    userId: "user-1",
    genericBankId: UUID,
    balance: "100.00",
    tag: "Tag",
    description: "Descrição",
    ...overrides,
  };
}

const makeCreateInput = (
  overrides: Partial<CreateOperationGenericBankInput> = {}
): CreateOperationGenericBankInput =>
  ({
    genericBankId: UUID,
    balance: "100.00",
    typeOperation: OperationEnum.DEPOSIT,
    local: LocalEnum.EXTERNAL,
    tag: "Tag padrão",
    description: "Descrição padrão",
    discount: null,
    forfeit: null,
    ...overrides,
  }) as CreateOperationGenericBankInput;

// ============================================================
// Suite
// ============================================================
describe("OperationGenericBankResolver", () => {
  let resolver: OperationGenericBankResolver;
  let mockEm: MockEntityManager;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.resetAllMocks();

    resolver = new OperationGenericBankResolver();
    mockEm = createMockEm();

    mockedLoggedContext.mockImplementation(async (_ctx, callback) =>
      callback(mockEm as unknown as Parameters<typeof callback>[0])
    );

    mockedToOperationGenericBankDto.mockImplementation(
      (op) =>
        makeOperationDto(
          op as unknown as Record<string, unknown>
        ) as ReturnType<typeof toOperationGenericBankDto>
    );

    mockedGeneralQueryFilter.mockReturnValue(
      {} as ReturnType<typeof generalQueryFilter>
    );
    mockedUuidFourVerify.mockReturnValue(true);
    mockedClearDecimal.mockImplementation((v) => v);
    mockedDecimalGreaterThan.mockReturnValue(false);
    mockedDecimalMultiply.mockReturnValue("100.00");
    mockedDecimalSum.mockReturnValue("1100.00");
    mockedRandomUUID.mockReturnValue("reg-uuid-1234");
    mockedValidate.mockResolvedValue([]);
  });

  // ============================================================
  // operationGenericBankList
  // ============================================================
  describe("operationGenericBankList", () => {
    const listInput: ListOperationGenericBankInput = {
      genericBankId: UUID,
      limit: 10,
      offset: 5,
    } as ListOperationGenericBankInput;

    it("retorna lista paginada com filtros padrão", async () => {
      const operations = [makeOperation()];
      mockEm.findAndCount.mockResolvedValue([operations, 1]);

      const result = await resolver.operationGenericBankList(
        makeContext(),
        listInput
      );

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        OperationGenericBank,
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            genericBankId: UUID,
          }),
          take: 10,
          skip: 5,
          order: { createdAt: "DESC" },
        })
      );
    });

    it("usa limit 20 e offset 0 quando não informados", async () => {
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.operationGenericBankList(makeContext(), {
        genericBankId: UUID,
      } as ListOperationGenericBankInput);

      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        OperationGenericBank,
        expect.objectContaining({ take: 20, skip: 0 })
      );
    });

    it("aplica filtro de genericBankBoxId quando fornecido", async () => {
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.operationGenericBankList(makeContext(), {
        genericBankId: UUID,
        genericBankBoxId: UUID_2,
      } as ListOperationGenericBankInput);

      const [, options] = mockEm.findAndCount.mock.calls[0];
      expect(options.where.genericBankBoxId).toBe(UUID_2);
    });

    it("aplica generalQueryFilter quando retornar algo", async () => {
      mockedGeneralQueryFilter.mockReturnValue({
        typeOperation: OperationEnum.DEPOSIT,
      } as ReturnType<typeof generalQueryFilter>);
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await resolver.operationGenericBankList(makeContext(), {
        genericBankId: UUID,
      } as ListOperationGenericBankInput);

      const [, options] = mockEm.findAndCount.mock.calls[0];
      expect(options.where.typeOperation).toBe(OperationEnum.DEPOSIT);
    });

    it("lança USER_NOT_AUTHENTICATED quando não há userId", async () => {
      await expect(
        resolver.operationGenericBankList(
          makeContext({ userId: undefined }),
          listInput
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("propaga erro genérico quando a consulta falha", async () => {
      mockEm.findAndCount.mockRejectedValue(new Error("DB error"));

      await expect(
        resolver.operationGenericBankList(makeContext(), listInput)
      ).rejects.toThrow("Failed to fetch operation generic bank list.");
    });
  });

  // ============================================================
  // operationGenericBankTransfer
  // ============================================================
  describe("operationGenericBankTransfer", () => {
    it("cria 2 operações em transferência interna entre bancos", async () => {
      const originBank = makeGenericBank({ id: UUID, balance: "1000.00" });
      const destinyBank = makeGenericBank({ id: UUID_2, balance: "500.00" });
      mockEm.findOne
        .mockResolvedValueOnce(originBank)
        .mockResolvedValueOnce(destinyBank);

      const result = await resolver.operationGenericBankTransfer(
        makeContext(),
        "100.00",
        OperationEnum.TRANSFER,
        UUID,
        UUID_2
      );

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(mockEm.save).toHaveBeenCalledTimes(4);
    });

    it("cria 1 operação quando destinationId é omitido", async () => {
      const originBank = makeGenericBank({ balance: "1000.00" });
      mockEm.findOne.mockResolvedValueOnce(originBank);

      const result = await resolver.operationGenericBankTransfer(
        makeContext(),
        "100.00",
        OperationEnum.TRANSFER,
        UUID
      );

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationGenericBankTransfer(
          makeContext({ userId: undefined }),
          "100.00",
          OperationEnum.TRANSFER,
          UUID
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança OPERATION_TYPE_INVALID quando typeOperation não é TRANSFER", async () => {
      await expect(
        resolver.operationGenericBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.DEPOSIT,
          UUID
        )
      ).rejects.toThrow(OPERATION_TYPE_INVALID);
    });

    it("lança erro quando originId não é UUID", async () => {
      mockedUuidFourVerify.mockReturnValueOnce(false);

      await expect(
        resolver.operationGenericBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          "nao-uuid"
        )
      ).rejects.toThrow("Origin Bank ID is not a valid UUID.");
    });

    it("lança erro quando destinationId não é UUID", async () => {
      mockedUuidFourVerify.mockReturnValueOnce(true).mockReturnValueOnce(false);

      await expect(
        resolver.operationGenericBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          UUID,
          "nao-uuid"
        )
      ).rejects.toThrow("Destination Bank ID is not a valid UUID.");
    });

    it("lança BALANCE_MUST_BE_POSITIVE quando o balance é negativo", async () => {
      mockedDecimalGreaterThan.mockReturnValueOnce(true);

      await expect(
        resolver.operationGenericBankTransfer(
          makeContext(),
          "-100.00",
          OperationEnum.TRANSFER,
          UUID
        )
      ).rejects.toThrow(BALANCE_MUST_BE_POSITIVE);
    });

    it("lança OperationError quando validate falha em origin", async () => {
      mockedValidate.mockResolvedValueOnce([{ property: "balance" }] as never);

      await expect(
        resolver.operationGenericBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          UUID
        )
      ).rejects.toBeInstanceOf(OperationError);
    });

    it("lança GENERIC_BANK_BOX_REQUIRED quando banco de origem não existe", async () => {
      mockEm.findOne.mockResolvedValueOnce(null);

      await expect(
        resolver.operationGenericBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          UUID
        )
      ).rejects.toThrow(GENERIC_BANK_BOX_REQUIRED);
    });

    it("lança GENERIC_BANK_BOX_REQUIRED quando banco de destino não existe", async () => {
      const originBank = makeGenericBank();
      mockEm.findOne
        .mockResolvedValueOnce(originBank)
        .mockResolvedValueOnce(null);

      await expect(
        resolver.operationGenericBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          UUID,
          UUID_2
        )
      ).rejects.toThrow(GENERIC_BANK_BOX_REQUIRED);
    });

    it("lança INSUFFICIENT_BALANCE quando origem tem saldo insuficiente", async () => {
      const originBank = makeGenericBank({ id: UUID, balance: "50.00" });
      const destinyBank = makeGenericBank({ id: UUID_2, balance: "500.00" });
      mockEm.findOne
        .mockResolvedValueOnce(originBank)
        .mockResolvedValueOnce(destinyBank);

      // 1ª: decimalGreaterThan("0.00", "100.00") → false (BALANCE_MUST_BE_POSITIVE passa)
      // 2ª: decimalGreaterThan("0.00", "-100.00") → true (entra no if)
      // 3ª: decimalGreaterThan("100.00", "50.00") → true (dispara INSUFFICIENT_BALANCE)
      mockedDecimalGreaterThan
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      await expect(
        resolver.operationGenericBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          UUID,
          UUID_2
        )
      ).rejects.toThrow(INSUFFICIENT_BALANCE);
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const originBank = makeGenericBank();
      mockEm.findOne.mockResolvedValueOnce(originBank);
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationGenericBankTransfer(
          makeContext(),
          "100.00",
          OperationEnum.TRANSFER,
          UUID
        )
      ).rejects.toThrow("Failed to save generic bank operation trasfer.");
    });
  });

  // ============================================================
  // operationGenericBankBoxUpdate
  // ============================================================
  describe("operationGenericBankBoxUpdate", () => {
    const updateInput: UpdateOperationGenericBankInput = {
      tag: "Nova tag",
      description: "Nova descrição",
    } as UpdateOperationGenericBankInput;

    it("atualiza os campos fornecidos e retorna o DTO", async () => {
      const operation = makeOperation();
      mockEm.findOne.mockResolvedValue(operation);

      const result = await resolver.operationGenericBankBoxUpdate(
        makeContext(),
        "op-1",
        updateInput
      );

      expect(operation.tag).toBe("Nova tag");
      expect(operation.description).toBe("Nova descrição");
      expect(mockEm.save).toHaveBeenCalledWith(OperationGenericBank, operation);
      expect(result).toBeDefined();
    });

    it("permite atualizar description para null (campo nullable)", async () => {
      const operation = makeOperation({ description: "Antiga" });
      mockEm.findOne.mockResolvedValue(operation);

      await resolver.operationGenericBankBoxUpdate(makeContext(), "op-1", {
        description: null,
      } as UpdateOperationGenericBankInput);

      expect(operation.description).toBeNull();
    });

    it("ignora campos undefined (mantém originais)", async () => {
      const operation = makeOperation({
        tag: "Original",
        description: "Desc",
      });
      mockEm.findOne.mockResolvedValue(operation);

      await resolver.operationGenericBankBoxUpdate(
        makeContext(),
        "op-1",
        {} as UpdateOperationGenericBankInput
      );

      expect(operation.tag).toBe("Original");
      expect(operation.description).toBe("Desc");
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationGenericBankBoxUpdate(
          makeContext({ userId: undefined }),
          "op-1",
          updateInput
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança OPERATION_NOT_FOUND quando operação não existe", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.operationGenericBankBoxUpdate(
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
        resolver.operationGenericBankBoxUpdate(
          makeContext(),
          "op-1",
          updateInput
        )
      ).rejects.toThrow("Failed to update operation generic bank.");
    });
  });

  // ============================================================
  // operationGenericBankDeposit
  // ============================================================
  describe("operationGenericBankDeposit", () => {
    const validInput: CreateOperationGenericBankInput = makeCreateInput({
      local: LocalEnum.EXTERNAL,
      typeOperation: OperationEnum.DEPOSIT,
      genericBankBoxId: null,
    });

    it("cria operação, soma ao saldo do banco e retorna DTO", async () => {
      const bank = makeGenericBank({ balance: "1000.00" });
      mockEm.findOne.mockResolvedValue(bank);

      const result = await resolver.operationGenericBankDeposit(makeContext(), {
        ...validInput,
      });

      expect(bank.balance).toBe("1100.00");
      expect(mockEm.save).toHaveBeenCalledWith(GenericBank, bank);
      expect(mockEm.save).toHaveBeenCalledWith(
        OperationGenericBank,
        expect.objectContaining({
          genericBankId: UUID,
          balance: "100.00",
        })
      );
      expect(result).toBeDefined();
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationGenericBankDeposit(
          makeContext({ userId: undefined }),
          { ...validInput }
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança erro quando genericBankBoxId é fornecido", async () => {
      await expect(
        resolver.operationGenericBankDeposit(makeContext(), {
          ...validInput,
          genericBankBoxId: UUID_2,
        })
      ).rejects.toThrow(
        "GenericBankBoxId should not be provided for this operation."
      );
    });

    it("lança OperationError quando validate do genericVerify falha", async () => {
      mockedValidate.mockResolvedValueOnce([{ property: "balance" }] as never);

      await expect(
        resolver.operationGenericBankDeposit(makeContext(), { ...validInput })
      ).rejects.toBeInstanceOf(OperationError);
    });

    it("lança OperationError quando validate do omitted falha", async () => {
      mockedValidate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ property: "discount" }] as never);

      await expect(
        resolver.operationGenericBankDeposit(makeContext(), { ...validInput })
      ).rejects.toBeInstanceOf(OperationError);
    });

    it("lança erro quando local não é EXTERNAL", async () => {
      await expect(
        resolver.operationGenericBankDeposit(makeContext(), {
          ...validInput,
          local: LocalEnum.INTERNAL,
        })
      ).rejects.toThrow("Local must be exactly EXTERNAL for this operation.");
    });

    it("lança OperationError quando validate do deposit falha", async () => {
      mockedValidate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ property: "balance" }] as never);

      await expect(
        resolver.operationGenericBankDeposit(makeContext(), { ...validInput })
      ).rejects.toBeInstanceOf(OperationError);
    });

    it("lança GENERIC_BANK_NOT_FOUND quando banco não existe", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.operationGenericBankDeposit(makeContext(), { ...validInput })
      ).rejects.toThrow(GENERIC_BANK_NOT_FOUND);
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const bank = makeGenericBank();
      mockEm.findOne.mockResolvedValue(bank);
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationGenericBankDeposit(makeContext(), { ...validInput })
      ).rejects.toThrow("Failed to perform operation generic bank deposit.");
    });
  });

  // ============================================================
  // operationGenericBankWithdraw
  // ============================================================
  describe("operationGenericBankWithdraw", () => {
    const validInput: CreateOperationGenericBankInput = makeCreateInput({
      local: LocalEnum.EXTERNAL,
      typeOperation: OperationEnum.WITHDRAW,
      balance: "-100.00",
      genericBankBoxId: null,
    });

    it("cria operação, subtrai do saldo do banco e retorna DTO", async () => {
      const bank = makeGenericBank({ balance: "1000.00" });
      mockEm.findOne.mockResolvedValue(bank);

      const result = await resolver.operationGenericBankWithdraw(
        makeContext(),
        { ...validInput }
      );

      expect(mockEm.save).toHaveBeenCalledWith(GenericBank, bank);
      expect(mockEm.save).toHaveBeenCalledWith(
        OperationGenericBank,
        expect.objectContaining({
          balance: "-100.00",
        })
      );
      expect(result).toBeDefined();
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationGenericBankWithdraw(
          makeContext({ userId: undefined }),
          { ...validInput }
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança erro quando genericBankBoxId é fornecido", async () => {
      await expect(
        resolver.operationGenericBankWithdraw(makeContext(), {
          ...validInput,
          genericBankBoxId: UUID_2,
        })
      ).rejects.toThrow(
        "GenericBankBoxId should not be provided for this operation."
      );
    });

    it("lança OperationError quando validate falha", async () => {
      mockedValidate.mockResolvedValueOnce([{ property: "balance" }] as never);

      await expect(
        resolver.operationGenericBankWithdraw(makeContext(), { ...validInput })
      ).rejects.toBeInstanceOf(OperationError);
    });

    it("lança erro quando local não é EXTERNAL", async () => {
      await expect(
        resolver.operationGenericBankWithdraw(makeContext(), {
          ...validInput,
          local: LocalEnum.INTERNAL,
        })
      ).rejects.toThrow("Local must be exactly EXTERNAL for this operation.");
    });

    it("lança GENERIC_BANK_NOT_FOUND quando banco não existe", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(
        resolver.operationGenericBankWithdraw(makeContext(), { ...validInput })
      ).rejects.toThrow(GENERIC_BANK_NOT_FOUND);
    });

    it("lança INSUFFICIENT_BALANCE quando valor excede o saldo", async () => {
      const bank = makeGenericBank({ balance: "50.00" });
      mockEm.findOne.mockResolvedValue(bank);
      mockedDecimalGreaterThan.mockReturnValueOnce(true);

      await expect(
        resolver.operationGenericBankWithdraw(makeContext(), { ...validInput })
      ).rejects.toThrow(INSUFFICIENT_BALANCE);
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const bank = makeGenericBank();
      mockEm.findOne.mockResolvedValue(bank);
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationGenericBankWithdraw(makeContext(), { ...validInput })
      ).rejects.toThrow("Failed to perform operation generic bank withdraw.");
    });
  });

  // ============================================================
  // operationGenericBankToGenericBankBox
  // ============================================================
  describe("operationGenericBankToGenericBankBox", () => {
    const depositInput: CreateOperationGenericBankInput = makeCreateInput({
      typeOperation: OperationEnum.DEPOSIT,
      local: LocalEnum.INTERNAL,
      genericBankBoxId: UUID_2,
      balance: "100.00",
    });

    const withdrawInput: CreateOperationGenericBankInput = makeCreateInput({
      typeOperation: OperationEnum.WITHDRAW,
      local: LocalEnum.INTERNAL,
      genericBankBoxId: UUID_2,
      balance: "-100.00",
    });

    it("processa DEPOSIT com sucesso", async () => {
      const bank = makeGenericBank({ balance: "1000.00" });
      const bankBox = makeGenericBankBox({ balance: "500.00" });
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(bankBox);

      const result = await resolver.operationGenericBankToGenericBankBox(
        makeContext(),
        { ...depositInput }
      );

      expect(mockEm.save).toHaveBeenCalledWith(GenericBank, bank);
      expect(mockEm.save).toHaveBeenCalledWith(
        OperationGenericBank,
        expect.any(Object)
      );
      expect(result).toBeDefined();
    });

    it("processa WITHDRAW com sucesso", async () => {
      const bank = makeGenericBank({ balance: "1000.00" });
      const bankBox = makeGenericBankBox({ balance: "500.00" });
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(bankBox);

      const result = await resolver.operationGenericBankToGenericBankBox(
        makeContext(),
        { ...withdrawInput }
      );

      expect(mockEm.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("lança USER_NOT_AUTHENTICATED quando userId ausente", async () => {
      await expect(
        resolver.operationGenericBankToGenericBankBox(
          makeContext({ userId: undefined }),
          { ...depositInput }
        )
      ).rejects.toThrow(USER_NOT_AUTHENTICATED);
    });

    it("lança GENERIC_BANK_BOX_REQUIRED quando genericBankBoxId ausente", async () => {
      await expect(
        resolver.operationGenericBankToGenericBankBox(makeContext(), {
          ...depositInput,
          genericBankBoxId: undefined,
        })
      ).rejects.toThrow(GENERIC_BANK_BOX_REQUIRED);
    });

    it("lança OperationError quando validate do genericVerify falha", async () => {
      mockedValidate.mockResolvedValueOnce([{ property: "balance" }] as never);

      await expect(
        resolver.operationGenericBankToGenericBankBox(makeContext(), {
          ...depositInput,
        })
      ).rejects.toBeInstanceOf(OperationError);
    });

    it("lança OPERATION_TYPE_INVALID quando typeOperation não é DEPOSIT nem WITHDRAW", async () => {
      await expect(
        resolver.operationGenericBankToGenericBankBox(makeContext(), {
          ...depositInput,
          typeOperation: OperationEnum.TRANSFER,
        })
      ).rejects.toThrow(OPERATION_TYPE_INVALID);
    });

    it("lança GENERIC_BANK_NOT_FOUND quando banco não existe", async () => {
      mockEm.findOne.mockResolvedValueOnce(null);

      await expect(
        resolver.operationGenericBankToGenericBankBox(makeContext(), {
          ...depositInput,
        })
      ).rejects.toThrow(GENERIC_BANK_NOT_FOUND);
    });

    it("lança GENERIC_BANK_BOX_NOT_FOUND quando bank box não existe", async () => {
      const bank = makeGenericBank();
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(null);

      await expect(
        resolver.operationGenericBankToGenericBankBox(makeContext(), {
          ...depositInput,
        })
      ).rejects.toThrow(GENERIC_BANK_BOX_NOT_FOUND);
    });

    it("lança INSUFFICIENT_BALANCE em DEPOSIT quando valor excede saldo do banco", async () => {
      const bank = makeGenericBank({ balance: "50.00" });
      const bankBox = makeGenericBankBox();
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(bankBox);
      mockedDecimalGreaterThan.mockReturnValueOnce(true);

      await expect(
        resolver.operationGenericBankToGenericBankBox(makeContext(), {
          ...depositInput,
        })
      ).rejects.toThrow(INSUFFICIENT_BALANCE);
    });

    it("propaga erro genérico quando em.save falha", async () => {
      const bank = makeGenericBank();
      const bankBox = makeGenericBankBox();
      mockEm.findOne.mockResolvedValueOnce(bank).mockResolvedValueOnce(bankBox);
      mockEm.save.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        resolver.operationGenericBankToGenericBankBox(makeContext(), {
          ...depositInput,
        })
      ).rejects.toThrow(
        "Failed to perform operation generic bank to generic bank box."
      );
    });
  });
});

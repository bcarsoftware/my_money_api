import {
  BALANCE_INVALID,
  INSUFFICIENT_BALANCE,
  USER_BANK_NOT_MATCH,
  USER_NOT_AUTHENTICATED,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { Bank } from "@/entities/Bank";
import { OperationBank } from "@/entities/OperationBank";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { OperationError } from "@/errors/OperationError";
import {
  OperationBankDto,
  PaginatedOperationBankDto,
} from "@/resolvers/operations/dtos/OperationBankDto";
import { toOperationBankDto } from "@/resolvers/operations/dtos/toOperationBankDto";
import {
  CreateOperationBankInput,
  ListOperationBankInput,
} from "@/resolvers/operations/inputs/OperationBankInputs";
import {
  BankDepositVerify,
  BankTransferVerify,
  BankWithdrawVerify,
} from "@/resolvers/operations/utils/OperationVerify";
import { generalQueryFilter } from "@/resolvers/operations/utils/generalQueryFilter";
import {
  balanceCurrencyVerify,
  uuidFourVerify,
} from "@/resolvers/operations/utils/operationUtils";
import {
  decimalGreaterThan,
  decimalMultiply,
  decimalSum,
} from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { randomUUID } from "@/utils/randomUUID";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { validate } from "class-validator";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class OperationBankResolver {
  @Protected()
  @Query(() => PaginatedOperationBankDto)
  async operationBankList(
    @Ctx() context: MyContext,
    @Arg("input", () => ListOperationBankInput) input: ListOperationBankInput
  ): Promise<PaginatedOperationBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const queryFilters = generalQueryFilter(input);

    return await loggedContext(context, async (em) => {
      try {
        const where = {
          userId,
          bankId: input.bankId,
          ...(input.bankBoxId && { bankBoxId: input.bankBoxId }),
          ...(input.invoiceId && { invoiceId: input.invoiceId }),
          ...(queryFilters && queryFilters),
        };

        const [operations, total] = await em.findAndCount(OperationBank, {
          where,
          take: limit,
          skip: offset,
          order: { createdAt: "DESC" },
        });

        const items = operations.map(toOperationBankDto);

        return { items, total };
      } catch (error) {
        console.error(error);

        throw new Error("Failed to fetch operation bank list.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationBankDto)
  async operationBankDeposit(
    @Ctx() context: MyContext,
    @Arg("bankId", () => String) bankId: string,
    @Arg("balance", () => String) balance: string
  ): Promise<OperationBankDto> {
    if (!balanceCurrencyVerify(balance)) throw new Error(BALANCE_INVALID);

    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    if (!uuidFourVerify(bankId))
      throw new Error("Bank ID is not a valid UUID.");

    return await loggedContext(context, async (em) => {
      const bank = await em.findOne(Bank, { where: { id: bankId, userId } });

      if (!bank) throw new Error(USER_BANK_NOT_MATCH);

      const operationRegister = randomUUID(7);

      const operation: CreateOperationBankInput = {
        bankId,
        balance,
        discount: null,
        forfeit: null,
        typeOperation: OperationEnum.DEPOSIT,
        local: LocalEnum.EXTERNAL,
        tag: `Deposit to bank ${bank.name}.`,
        description: `Deposit of ${balance} to bank ${bank.name}`,
      };

      const errorsInitial = await validate(operation);

      if (errorsInitial.length > 0) throw new OperationError(errorsInitial);

      const deposit: BankDepositVerify = {
        discount: null,
        forfeit: null,
        amount: balance,
        ...operation,
      };

      const depositErrors = await validate(deposit);

      if (depositErrors.length > 0) throw new OperationError(depositErrors);

      try {
        const savedOperation = await em.save(OperationBank, {
          ...operation,
          operationRegister,
        });
        bank.balance = decimalSum(bank.balance, operation.balance);

        await bank.save();

        return toOperationBankDto(savedOperation);
      } catch (error) {
        console.error(error);

        throw new Error("Failed to deposit to bank.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationBankDto)
  async operationBankWithdraw(
    @Ctx() context: MyContext,
    @Arg("bankId", () => String) bankId: string,
    @Arg("balance", () => String) balance: string
  ): Promise<OperationBankDto> {
    if (!balanceCurrencyVerify(balance)) throw new Error(BALANCE_INVALID);

    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    if (!uuidFourVerify(bankId))
      throw new Error("Bank ID is not a valid UUID.");

    return await loggedContext(context, async (em) => {
      const bank = await em.findOne(Bank, { where: { id: bankId, userId } });

      if (!bank) throw new Error(USER_BANK_NOT_MATCH);

      const operationRegister = randomUUID(7);

      const operation: CreateOperationBankInput = {
        bankId,
        balance,
        discount: null,
        forfeit: null,
        typeOperation: OperationEnum.WITHDRAW,
        local: LocalEnum.EXTERNAL,
        tag: `Withdraw from bank ${bank.name}.`,
        description: `Withdraw of ${balance} from bank ${bank.name}`,
      };

      const errorsInitial = await validate(operation);

      if (errorsInitial.length > 0) throw new OperationError(errorsInitial);

      const withdraw: BankWithdrawVerify = {
        discount: null,
        forfeit: null,
        amount: balance,
        ...operation,
      };

      const withdrawErrors = await validate(withdraw);

      if (withdrawErrors.length > 0) throw new OperationError(withdrawErrors);

      const withdBalance = decimalMultiply(operation.balance, "-1.00");

      if (decimalGreaterThan(withdBalance, bank.balance))
        throw new Error(INSUFFICIENT_BALANCE);

      try {
        const savedOperation = await em.save(OperationBank, {
          ...operation,
          operationRegister,
        });
        bank.balance = decimalSum(bank.balance, operation.balance);

        await bank.save();

        return toOperationBankDto(savedOperation);
      } catch (error) {
        console.error(error);

        throw new Error("Failed to withdraw from bank.");
      }
    });
  }

  @Protected()
  @Mutation(() => PaginatedOperationBankDto)
  async operationBankTransfer(
    @Ctx() context: MyContext,
    @Arg("balance", () => String) balance: string,
    @Arg("typeOperation", () => OperationEnum) typeOperation: OperationEnum,
    @Arg("originBankId", () => String) originBankId: string,
    @Arg("destinationBankId", () => String) destinationBankId?: string
  ): Promise<PaginatedOperationBankDto> {
    if (!balanceCurrencyVerify(balance)) throw new Error(BALANCE_INVALID);

    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    if (!uuidFourVerify(originBankId))
      throw new Error("Origin Bank ID is not a valid UUID.");

    if (destinationBankId && !uuidFourVerify(destinationBankId))
      throw new Error("Destination Bank ID is not a valid UUID.");

    if (!balanceCurrencyVerify(balance)) throw new Error(BALANCE_INVALID);

    const transfer: BankTransferVerify = {
      originBankId,
      destinationBankId,
      balance,
      discount: null,
      forfeit: null,
      amount: balance,
      local: destinationBankId ? LocalEnum.INTERNAL : LocalEnum.EXTERNAL,
      typeOperation,
    };

    const transferErrors = await validate(transfer);

    if (transferErrors.length > 0) throw new OperationError(transferErrors);

    const operations: Record<string, CreateOperationBankInput | null> = {
      origin: {
        ...transfer,
        tag: "Transference",
        description: "Transfer from origin to destination bank",
        bankId: originBankId,
      } as CreateOperationBankInput,
      destination:
        destinationBankId && transfer.local === LocalEnum.INTERNAL
          ? ({
              ...transfer,
              tag: "Transference",
              description: "Transfer from origin to destination bank",
              bankId: destinationBankId,
            } as CreateOperationBankInput)
          : null,
    };

    for (const cperation of Object.values(operations)) {
      if (!cperation) continue;

      const operationErrors = await validate(cperation);

      if (operationErrors.length > 0) throw new OperationError(operationErrors);
    }

    return await loggedContext(context, async (em) => {
      const banks: Record<string, Bank | null> = {
        origin: await em.findOne(Bank, { where: { id: originBankId, userId } }),
        destination: destinationBankId
          ? await em.findOne(Bank, { where: { id: destinationBankId, userId } })
          : null,
      };

      if (!banks.origin) throw new Error("Origin bank not found.");
      if (destinationBankId && !banks.destination)
        throw new Error("Destination bank not found.");

      if (!operations.origin?.local)
        throw new Error("Origin operation local is not defined.");

      const operationRegister = randomUUID(7);

      try {
        if (
          operations.destination &&
          operations.origin.local === LocalEnum.INTERNAL &&
          banks.destination
        ) {
          const amount = operations.origin.balance.replace("-", "");

          operations.origin.balance = decimalMultiply(amount, "-1.00");
          operations.destination.balance = amount;

          banks.origin.balance = decimalSum(
            banks.origin.balance,
            operations.origin.balance
          );
          banks.destination.balance = decimalSum(
            banks.destination.balance,
            operations.destination.balance
          );

          await em.save(banks.origin);
          await em.save(banks.destination);

          const sendOperation = await em.save(OperationBank, {
            ...operations.origin,
            userId,
            tag: "Transfer Sent.",
            description: `Transfer Sent. Using ${operations.origin.typeOperation}. Total: ${operations.origin.balance}`,
            amount: operations.origin.balance,
            operationRegister,
          });

          const receiveOperation = await em.save(OperationBank, {
            ...operations.destination,
            userId,
            tag: "Transfer Received.",
            description: `Transfer Received. Using ${operations.destination.typeOperation}. Total: ${operations.destination.balance}`,
            amount: operations.destination.balance,
            operationRegister,
          });

          const items = [
            toOperationBankDto(sendOperation),
            toOperationBankDto(receiveOperation),
          ];

          return { total: 2, items };
        }

        if (decimalGreaterThan(operations.origin.balance, "0.00")) {
          const amount = operations.origin.balance.replace("-", "");

          if (decimalGreaterThan(amount, banks.origin.balance))
            throw new Error(INSUFFICIENT_BALANCE);
        }

        banks.origin.balance = decimalSum(
          banks.origin.balance,
          operations.origin.balance
        );

        await em.save(banks.origin);

        const tag =
          operations.origin.balance[0] === "-"
            ? "Transfer Received."
            : "Transfer Sent.";

        const operationBank = await em.save(OperationBank, {
          ...operations.origin,
          userId,
          tag,
          description: `${tag} Using ${operations.origin.typeOperation}. Total: ${operations.origin.balance}`,
          amount: operations.origin.balance,
          operationRegister,
        });

        return { total: 1, items: [toOperationBankDto(operationBank)] };
      } catch (error) {
        console.error("Error occurred during bank transfer:", error);

        throw new Error("Failed to complete bank operation transfer.");
      }
    });
  }
}

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
}

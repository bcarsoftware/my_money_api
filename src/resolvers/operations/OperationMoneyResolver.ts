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
import {
  OperationMoneyDto,
  PaginatedOperationMoneyDto,
} from "@/resolvers/operations/dtos/OperationMoneyDto";
import { toOperationMoneyDto } from "@/resolvers/operations/dtos/toOperationMoneyDto";
import {
  CreateOperationMoneyInput,
  ListOperationMoneyInput,
} from "@/resolvers/operations/inputs/OperationMoneyInputs";
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
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

@Resolver()
export class OperationMoneyResolver {
  @Protected()
  @Query(() => PaginatedOperationMoneyDto)
  async operationMoneyList(
    @Ctx() context: MyContext,
    @Arg("input", () => ListOperationMoneyInput)
    input: ListOperationMoneyInput
  ): Promise<PaginatedOperationMoneyDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const queryFilters = generalQueryFilter(input);

    return await loggedContext(context, async (em) => {
      try {
        const where = {
          userId,
          moneyId: input.moneyId,
          ...(queryFilters && queryFilters),
        };

        const [operations, total] = await em.findAndCount(OperationMoney, {
          where,
          take: limit,
          skip: offset,
          order: { createdAt: "DESC" },
        });

        const items = operations.map(toOperationMoneyDto);

        return { items, total };
      } catch (error) {
        console.error(error);

        throw new Error("Failed to fetch operation money list.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationMoneyDto)
  async operationMoneyDeposit(
    @Ctx() context: MyContext,
    @Arg("input", () => OperationMoneyDepositInput)
    input: OperationMoneyDepositInput
  ): Promise<OperationMoneyDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    input.amount = clearDecimal(input.amount);

    const operation: CreateOperationMoneyInput = {
      moneyId: input.moneyId,
      balance: input.amount,
      tag: `Deposit of ${input.amount}`,
      typeOperation: OperationEnum.DEPOSIT,
      local: input.local,
    };

    const registeredOperation = randomUUID(7);

    return await loggedContext(context, async (em) => {
      const money = await em.findOne(Money, {
        where: { id: input.moneyId, userId },
      });

      if (!money) throw new Error(MONEY_NOT_FOUND);

      money.balance = decimalSum(money.balance, input.amount);

      try {
        await em.save(Money, money);

        operation.description = `Deposit of ${input.amount} to money ${money.tag}.`;

        const newOperation = await em.save(OperationMoney, {
          ...operation,
          userId,
          operationRegister: registeredOperation,
        });

        return toOperationMoneyDto(newOperation);
      } catch (error) {
        console.error("Failed to save operation money:", error);

        throw new Error("Failed to save operation money.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationMoneyDto)
  async operationMoneyWithdraw(
    @Ctx() context: MyContext,
    @Arg("input", () => OperationMoneyWithdrawInput)
    input: OperationMoneyWithdrawInput
  ): Promise<OperationMoneyDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    input.amount = clearDecimal(input.amount);

    const operation: CreateOperationMoneyInput = {
      moneyId: input.moneyId,
      balance: input.amount,
      tag: `Withdraw of ${input.amount}`,
      typeOperation: OperationEnum.WITHDRAW,
      local: input.local,
    };

    const registeredOperation = randomUUID(7);

    const amount = input.amount.replace("-", "");

    return await loggedContext(context, async (em) => {
      const money = await em.findOne(Money, {
        where: { id: input.moneyId, userId },
      });

      if (!money) throw new Error(MONEY_NOT_FOUND);

      if (decimalGreaterThan(amount, money.balance))
        throw new Error(INSUFFICIENT_BALANCE);

      money.balance = decimalSum(money.balance, input.amount);

      try {
        await em.save(Money, money);

        operation.description = `Withdraw of ${input.amount} from money ${money.tag}.`;

        const newOperation = await em.save(OperationMoney, {
          ...operation,
          userId,
          operationRegister: registeredOperation,
        });

        return toOperationMoneyDto(newOperation);
      } catch (error) {
        console.error("Failed to save operation money:", error);

        throw new Error("Failed to save operation money.");
      }
    });
  }

  @Protected()
  @Mutation(() => PaginatedOperationMoneyDto)
  async operationMoneyTransfer(
    @Ctx() context: MyContext,
    @Arg("input", () => OperationMoneyTransferInput)
    input: OperationMoneyTransferInput
  ): Promise<PaginatedOperationMoneyDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    input.amount = clearDecimal(input.amount);

    const inverse = decimalMultiply(input.amount, "-1.00");

    if (input.toMoneyId && input.local === LocalEnum.EXTERNAL)
      throw new Error(TO_MONEY_ID_OMITTED_FOR_EXTERNAL);

    const operations: CreateOperationMoneyInput[] = [
      {
        moneyId: input.fromMoneyId,
        balance: input.amount,
        tag: `Transfer of ${input.amount} using ${input.typeOperation}`,
        description: `Transfer of ${input.amount} using ${input.typeOperation}`,
        typeOperation: OperationEnum[input.typeOperation],
        local: input.local,
      },
    ];

    return await loggedContext(context, async (em) => {
      const origin = await em.findOne(Money, {
        where: { id: input.fromMoneyId, userId },
      });

      if (!origin) throw new Error(MONEY_NOT_FOUND);

      const destination = await em.findOne(Money, {
        where: { id: input.toMoneyId, userId },
      });

      if (input.toMoneyId && !destination) throw new Error(MONEY_NOT_FOUND);

      switch (input.typeOperation) {
        case MoneyTransferEnum.SEND:
          if (!decimalGreaterThan("0.00", input.amount))
            throw new Error(AMOUNT_INVALID_FOR_SEND);
          if (decimalGreaterThan(inverse, origin.balance))
            throw new Error(INSUFFICIENT_BALANCE);
          break;
        case MoneyTransferEnum.RECEIVE:
          if (decimalGreaterThan("0.00", input.amount))
            throw new Error(AMOUNT_INVALID_FOR_RECEIVE);
          break;
      }

      if (destination && input.typeOperation === MoneyTransferEnum.RECEIVE) {
        if (decimalGreaterThan(inverse, destination.balance))
          throw new Error(INSUFFICIENT_BALANCE);
      }

      try {
        if (destination) {
          destination.balance = decimalSum(destination.balance, inverse);
          await em.save(Money, destination);

          operations.push({
            moneyId: destination.id,
            balance: inverse,
            tag: `Transfer of ${inverse} using ${input.typeOperation}`,
            description: `Transfer of ${inverse} using ${input.typeOperation}`,
            typeOperation:
              input.typeOperation === MoneyTransferEnum.SEND
                ? OperationEnum.RECEIVE
                : OperationEnum.SEND,
            local: input.local,
          });
        }

        origin.balance = decimalSum(origin.balance, input.amount);

        await em.save(Money, origin);

        const items: OperationMoneyDto[] = [];

        for (const operation of operations) {
          const response = await em.save(OperationMoney, operation);
          if (!response) continue;
          items.push(toOperationMoneyDto(response));
        }

        return { items, total: items.length };
      } catch (error) {
        console.error("Failed to perform money transfer operation:", error);

        throw new Error("Failed to perform money transfer operation.");
      }
    });
  }
}

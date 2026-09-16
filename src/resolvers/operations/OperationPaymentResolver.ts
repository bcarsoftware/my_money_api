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
import { Bank } from "@/entities/Bank";
import { GenericBank } from "@/entities/GenericBank";
import { Money } from "@/entities/Money";
import { OperationPayment } from "@/entities/OperationPayment";
import { Payment } from "@/entities/Payment";
import { OperationEnum } from "@/enums/OperationEnum";
import {
  OperationPaymentDto,
  PaginatedOperationPaymentDto,
} from "@/resolvers/operations/dtos/OperationPaymentDto";
import {
  CreateOperationPaymentInput,
  ListOperationPaymentInput,
  UpdateOperationPaymentInput,
} from "@/resolvers/operations/inputs/OperationPaymentInputs";
import { generalQueryFilter } from "@/resolvers/operations/utils/generalQueryFilter";
import {
  decimalGreaterThan,
  decimalSubtract,
  decimalSumSequence,
} from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { randomUUID } from "@/utils/randomUUID";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { EntityManager } from "typeorm";
import { toOperationPaymentDto } from "./dtos/toOperationPaymentDto";
import { uuidFourVerify } from "./utils/operationUtils";

interface Identity {
  bankId?: string | null;
  genericBankId?: string | null;
  moneyId?: string | null;
}

@Resolver()
export class OperationPaymentResolver {
  @Protected()
  @Query(() => PaginatedOperationPaymentDto)
  async operationPaymentList(
    @Ctx() context: MyContext,
    @Arg("input", () => ListOperationPaymentInput)
    input: ListOperationPaymentInput
  ): Promise<PaginatedOperationPaymentDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const queryFilters = generalQueryFilter(input);

    return await loggedContext(context, async (em) => {
      try {
        const where = {
          userId,
          paymentId: input.paymentId,
          ...(queryFilters && queryFilters),
        };

        const [operations, total] = await em.findAndCount(OperationPayment, {
          where,
          take: limit,
          skip: offset,
          order: { createdAt: "DESC" },
        });

        const items = operations.map(toOperationPaymentDto);

        return { items, total };
      } catch (error) {
        console.error(error);

        throw new Error("Failed to fetch operation generic bank list.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationPaymentDto)
  async operationPaymentUpdate(
    @Ctx() context: MyContext,
    @Arg("operationId", () => String)
    operationId: string,
    @Arg("input", () => UpdateOperationPaymentInput)
    input: UpdateOperationPaymentInput
  ): Promise<OperationPaymentDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    if (!uuidFourVerify(operationId)) throw new Error(INVALID_OPERATION_ID);

    return await loggedContext(context, async (em) => {
      const operation = await em.findOne(OperationPayment, {
        where: { id: operationId, userId },
      });

      if (!operation) throw new Error(OPERATION_NOT_FOUND);

      operation.tag = input.tag ?? operation.tag;
      operation.description =
        input.description !== undefined
          ? input.description
          : operation.description;

      try {
        const newOperation = await em.save(OperationPayment, operation);

        return toOperationPaymentDto(newOperation);
      } catch (error) {
        console.error("Failed to update operation payment:", error);

        throw new Error("Failed to update operation payment.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationPaymentDto)
  async operationMakePayment(
    @Ctx() context: MyContext,
    @Arg("input", () => CreateOperationPaymentInput)
    input: CreateOperationPaymentInput
  ): Promise<OperationPaymentDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    const ids: Identity = { ...input };

    const countIds = [ids.bankId, ids.genericBankId, ids.moneyId].filter(
      (id) => id
    ).length;

    if (countIds !== 1) throw new Error(ONLY_ONE_ID_MUST_BE_PROVIDED);

    const amount = decimalSumSequence([
      input.balance,
      input.discount ?? "0.00",
      input.forfeit ?? "0.00",
    ]);

    return await loggedContext(context, async (em) => {
      const payment = await em.findOne(Payment, {
        where: { id: input.paymentId, userId },
      });

      if (!payment) throw new Error(PAYMENT_NOT_FOUND);

      const account: Bank | GenericBank | Money | null =
        await this.getFinancesAccount(ids, em, userId);

      if (!account) throw new Error(MONEY_OR_BANK_ACCOUNT_NOT_FOUND);

      if (decimalGreaterThan(amount, account.balance))
        throw new Error(INSUFFICIENT_BALANCE);

      try {
        account.balance = decimalSubtract(account.balance, amount);

        await account.save();

        const operationRegister = randomUUID(7);

        const operation = await em.save(OperationPayment, {
          userId,
          tag: input.tag,
          description: input.description ?? null,
          paymentId: input.paymentId,
          bankId: input.bankId,
          genericBankId: input.genericBankId,
          moneyId: input.moneyId,
          balance: input.balance ?? null,
          discount: input.discount ?? null,
          forfeit: input.forfeit ?? null,
          typeOperation: OperationEnum.PAYMENT,
          local: input.local,
          amount,
          operationRegister,
        });

        return toOperationPaymentDto(operation);
      } catch (error) {
        console.error("Failed to process operation payment:", error);

        throw new Error("Failed to process operation payment.");
      }
    });
  }

  private async getFinancesAccount(
    ids: Identity,
    em: EntityManager,
    userId: string
  ): Promise<Bank | GenericBank | Money | null> {
    switch (true) {
      case !!ids.bankId:
        return await em.findOne(Bank, { where: { id: ids.bankId, userId } });
      case !!ids.genericBankId:
        return await em.findOne(GenericBank, {
          where: { id: ids.genericBankId, userId },
        });
      case !!ids.moneyId:
        return await em.findOne(Money, { where: { id: ids.moneyId, userId } });
    }

    return null;
  }
}

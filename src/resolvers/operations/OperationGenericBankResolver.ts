import {
  BALANCE_MUST_BE_POSITIVE,
  FROM_GENERIC_BANK_ID_MUST_OMITTED_EXTERNAL,
  GENERIC_BANK_BOX_NOT_FOUND,
  GENERIC_BANK_BOX_REQUIRED,
  GENERIC_BANK_NOT_FOUND,
  INSUFFICIENT_BALANCE,
  OPERATION_NOT_FOUND,
  OPERATION_TYPE_INVALID,
  TO_GENERIC_BANK_ID_REQUIRED,
  USER_NOT_AUTHENTICATED,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { GenericBank } from "@/entities/GenericBank";
import { GenericBankBox } from "@/entities/GenericBankBox";
import { OperationGenericBank } from "@/entities/OperationGenericBank";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { OperationError } from "@/errors/OperationError";
import {
  OperationGenericBankDto,
  PaginatedOperationGenericBankDto,
} from "@/resolvers/operations/dtos/OperationGenericBankDto";
import { toOperationGenericBankDto } from "@/resolvers/operations/dtos/toOperationGenericBankDto";
import {
  CreateOperationGenericBankInput,
  ListOperationGenericBankInput,
  UpdateOperationGenericBankInput,
} from "@/resolvers/operations/inputs/OperationGenericBankInputs";
import { generalQueryFilter } from "@/resolvers/operations/utils/generalQueryFilter";
import {
  DepositVerify,
  DiscountForfeitOmitted,
  GenericBankVerify,
  WithdrawVerify,
} from "@/resolvers/operations/utils/OperationVerify";
import {
  clearDecimal,
  decimalGreaterThan,
  decimalMultiply,
  decimalSum,
} from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { randomUUID } from "@/utils/randomUUID";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { validate } from "class-validator";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import {
  OperationGenericBankDepositInput,
  OperationGenericBankTransferInput,
  OperationGenericBankWithdrawInput,
} from "./inputs/OperationsInputs";

@Resolver()
export class OperationGenericBankResolver {
  @Protected()
  @Query(() => PaginatedOperationGenericBankDto)
  async operationGenericBankList(
    @Ctx() context: MyContext,
    @Arg("input", () => ListOperationGenericBankInput)
    input: ListOperationGenericBankInput
  ): Promise<PaginatedOperationGenericBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const queryFilters = generalQueryFilter(input);

    return await loggedContext(context, async (em) => {
      try {
        const where = {
          userId,
          genericBankId: input.genericBankId,
          ...(input.genericBankBoxId && {
            genericBankBoxId: input.genericBankBoxId,
          }),
          ...(queryFilters && queryFilters),
        };

        const [operations, total] = await em.findAndCount(
          OperationGenericBank,
          {
            where,
            take: limit,
            skip: offset,
            order: { createdAt: "DESC" },
          }
        );

        const items = operations.map(toOperationGenericBankDto);

        return { items, total };
      } catch (error) {
        console.error(error);

        throw new Error("Failed to fetch operation generic bank list.");
      }
    });
  }

  @Protected()
  @Mutation(() => PaginatedOperationGenericBankDto)
  async operationGenericBankTransfer(
    @Ctx() context: MyContext,
    @Arg("input", () => OperationGenericBankTransferInput)
    input: OperationGenericBankTransferInput
  ): Promise<PaginatedOperationGenericBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    if (input.local === LocalEnum.EXTERNAL && input.toGenericBankId)
      throw new Error(FROM_GENERIC_BANK_ID_MUST_OMITTED_EXTERNAL);

    if (input.local === LocalEnum.INTERNAL && !input.toGenericBankId)
      throw new Error(TO_GENERIC_BANK_ID_REQUIRED);

    if (
      input.local === LocalEnum.INTERNAL &&
      decimalGreaterThan("0.00", input.amount)
    )
      throw new Error(BALANCE_MUST_BE_POSITIVE);

    return await loggedContext(context, async (em) => {
      const origin = await em.findOne(GenericBank, {
        where: { id: input.fromGenericBankId, userId },
      });

      if (!origin) throw new Error(GENERIC_BANK_NOT_FOUND);

      const destination: GenericBank | null = await em.findOne(GenericBank, {
        where: { id: input.toGenericBankId, userId },
      });

      if (input.toGenericBankId && !destination)
        throw new Error(GENERIC_BANK_NOT_FOUND);

      const amount = input.amount.replace("-", "");

      const status = decimalGreaterThan("0.00", input.amount)
        ? "Sent."
        : "Received.";

      const operations: CreateOperationGenericBankInput[] = [
        {
          genericBankId: input.fromGenericBankId,
          balance: input.amount,
          typeOperation: OperationEnum[input.typeOperation],
          local: input.local,
          tag: `Transfer ${input.amount} ${status} using ${input.typeOperation}.`,
          description: `Transfer of ${input.amount} from bank ${origin.name}.`,
        },
      ];

      switch (input.local) {
        case LocalEnum.INTERNAL:
          if (decimalGreaterThan(amount, origin.balance))
            throw new Error(INSUFFICIENT_BALANCE);
          origin.balance = decimalSum(origin.balance, input.amount);
          if (!destination) throw new Error(GENERIC_BANK_NOT_FOUND);
          destination.balance = decimalSum(destination.balance, amount);
          operations.push({
            genericBankId: destination.id,
            balance: amount,
            typeOperation: OperationEnum[input.typeOperation],
            local: input.local,
            tag: `Transfer ${amount} Received! Using ${input.typeOperation}.`,
            description: `Transfer of ${input.amount} to bank ${destination.name}.`,
          });
          break;
        case LocalEnum.EXTERNAL:
          if (
            decimalGreaterThan("0.00", input.amount) &&
            decimalGreaterThan(amount, origin.balance)
          )
            throw new Error(INSUFFICIENT_BALANCE);
          origin.balance = decimalSum(origin.balance, input.amount);
          break;
      }

      try {
        await em.save(GenericBank, origin);
        if (destination) await em.save(GenericBank, destination);

        const items: OperationGenericBankDto[] = [];

        for (const operation of operations) {
          const response = await em.save(OperationGenericBank, operation);
          if (!response) continue;
          items.push(toOperationGenericBankDto(response));
        }

        return { items, total: items.length };
      } catch (error) {
        console.error("Error occurred during bank transfer operation:", error);

        throw new Error("Bank transfer operation failed.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationGenericBankDto)
  async operationGenericBankUpdate(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string,
    @Arg("input", () => UpdateOperationGenericBankInput)
    input: UpdateOperationGenericBankInput
  ): Promise<OperationGenericBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    return await loggedContext(context, async (em) => {
      const operation = await em.findOne(OperationGenericBank, {
        where: { id, userId },
      });

      if (!operation) throw new Error(OPERATION_NOT_FOUND);

      operation.tag = input.tag ?? operation.tag;
      operation.description =
        input.description !== undefined
          ? input.description
          : operation.description;

      try {
        const updatedOperation = await em.save(OperationGenericBank, operation);
        return toOperationGenericBankDto(updatedOperation);
      } catch (error) {
        console.error("Failed to update operation generic bank:", error);

        throw new Error("Failed to update operation generic bank.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationGenericBankDto)
  async operationGenericBankDeposit(
    @Ctx() context: MyContext,
    @Arg("input", () => OperationGenericBankDepositInput)
    input: OperationGenericBankDepositInput
  ): Promise<OperationGenericBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    input.amount = clearDecimal(input.amount);

    return await loggedContext(context, async (em) => {
      const bank = await em.findOne(GenericBank, {
        where: { id: input.genericBankId, userId },
      });

      if (!bank) throw new Error(GENERIC_BANK_NOT_FOUND);

      bank.balance = decimalSum(bank.balance, input.amount);

      const operation: CreateOperationGenericBankInput = {
        genericBankId: input.genericBankId,
        balance: input.amount,
        discount: null,
        forfeit: null,
        typeOperation: OperationEnum.DEPOSIT,
        local: LocalEnum.EXTERNAL,
        tag: `Deposit into bank ${bank.name}.`,
        description: `Deposit of ${input.amount} into bank ${bank.name}.`,
      };

      const registerOperation = randomUUID(7);

      try {
        await em.save(GenericBank, bank);

        const savedOperation = await em.save(OperationGenericBank, {
          ...operation,
          operationRegister: registerOperation,
        });

        return toOperationGenericBankDto(savedOperation);
      } catch (error) {
        console.error("Failed to deposit into bank.", error);

        throw new Error("Failed to deposit into bank.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationGenericBankDto)
  async operationGenericBankWithdraw(
    @Ctx() context: MyContext,
    @Arg("input", () => OperationGenericBankWithdrawInput)
    input: OperationGenericBankWithdrawInput
  ): Promise<OperationGenericBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    input.amount = clearDecimal(input.amount);

    return await loggedContext(context, async (em) => {
      const bank = await em.findOne(GenericBank, {
        where: { id: input.genericBankId, userId },
      });

      if (!bank) throw new Error(GENERIC_BANK_NOT_FOUND);

      const amount = decimalMultiply(input.amount, "-1.00");

      if (decimalGreaterThan(amount, bank.balance))
        throw new Error(INSUFFICIENT_BALANCE);

      bank.balance = decimalSum(bank.balance, input.amount);

      const operation: CreateOperationGenericBankInput = {
        genericBankId: input.genericBankId,
        balance: input.amount,
        discount: null,
        forfeit: null,
        typeOperation: OperationEnum.WITHDRAW,
        local: LocalEnum.EXTERNAL,
        tag: `Withdraw from bank ${bank.name}.`,
        description: `Withdraw of ${input.amount} from bank ${bank.name}.`,
      };

      const registerOperation = randomUUID(7);

      try {
        await em.save(GenericBank, bank);

        const savedOperation = await em.save(OperationGenericBank, {
          ...operation,
          operationRegister: registerOperation,
        });

        return toOperationGenericBankDto(savedOperation);
      } catch (error) {
        console.error("Failed to withdraw from bank.", error);

        throw new Error("Failed to withdraw from bank.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationGenericBankDto)
  async operationGenericBankToGenericBankBox(
    @Ctx() context: MyContext,
    @Arg("input", () => CreateOperationGenericBankInput)
    input: CreateOperationGenericBankInput
  ): Promise<OperationGenericBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    const { genericBankBoxId } = input;

    if (!genericBankBoxId) throw new Error(GENERIC_BANK_BOX_REQUIRED);

    input.balance = clearDecimal(input.balance);

    const genericVerify: GenericBankVerify = {
      ...input,
    };

    let errors = await validate(genericVerify);

    if (errors.length > 0) throw new OperationError(errors);

    const omitted: DiscountForfeitOmitted = { ...input };

    errors = await validate(omitted);

    switch (input.typeOperation) {
      case OperationEnum.DEPOSIT:
        const deposit: DepositVerify = { ...input };
        errors = await validate(deposit);
        if (errors.length > 0) throw new OperationError(errors);
        break;
      case OperationEnum.WITHDRAW:
        const withdraw: WithdrawVerify = { ...input };
        errors = await validate(withdraw);
        if (errors.length > 0) throw new OperationError(errors);
        break;
      default:
        throw new Error(OPERATION_TYPE_INVALID);
    }

    return await loggedContext(context, async (em) => {
      const genericBank = await em.findOne(GenericBank, {
        where: { id: input.genericBankId, userId },
      });

      if (!genericBank) throw new Error(GENERIC_BANK_NOT_FOUND);

      const genericBankBox = await em.findOne(GenericBankBox, {
        where: { id: genericBankBoxId, genericBankId: input.genericBankId },
      });

      if (!genericBankBox) throw new Error(GENERIC_BANK_BOX_NOT_FOUND);

      const genericBankBalance = decimalMultiply(input.balance, "-1.00");

      if (
        input.typeOperation === OperationEnum.DEPOSIT &&
        decimalGreaterThan(input.balance, genericBank.balance)
      ) {
        throw new Error(INSUFFICIENT_BALANCE);
      }

      genericBank.balance = decimalSum(genericBank.balance, genericBankBalance);

      try {
        await em.save(GenericBank, genericBank);

        const operationRegister = randomUUID(7);

        const operation = em.create(OperationGenericBank, {
          ...input,
          operationRegister,
          amount: input.balance,
        });

        const newOperation = await em.save(OperationGenericBank, operation);

        return toOperationGenericBankDto(newOperation);
      } catch (error) {
        console.error(
          "Error saving generic bank operation to generic bank box:",
          error
        );
        throw new Error(
          "Failed to perform operation generic bank to generic bank box."
        );
      }
    });
  }
}

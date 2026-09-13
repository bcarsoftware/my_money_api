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
import { uuidFourVerify } from "@/resolvers/operations/utils/operationUtils";
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
  @Mutation(() => OperationGenericBankDto)
  async operationGenericBankTransfer(
    @Ctx() context: MyContext,
    @Arg("balance", () => String) balance: string,
    @Arg("typeOperation", () => OperationEnum) typeOperation: OperationEnum,
    @Arg("originId", () => String) originId: string,
    @Arg("destinationId", () => String) destinationId?: string
  ): Promise<PaginatedOperationGenericBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    if (typeOperation !== OperationEnum.TRANSFER)
      throw new Error(OPERATION_TYPE_INVALID);

    if (!uuidFourVerify(originId))
      throw new Error("Origin Bank ID is not a valid UUID.");

    if (destinationId && !uuidFourVerify(destinationId))
      throw new Error("Destination Bank ID is not a valid UUID.");

    balance = clearDecimal(balance);

    if (decimalGreaterThan("0.00", balance))
      throw new Error(BALANCE_MUST_BE_POSITIVE);

    const local = destinationId ? LocalEnum.INTERNAL : LocalEnum.EXTERNAL;

    const origin: CreateOperationGenericBankInput = {
      genericBankId: originId,
      tag: "transfer",
      description: "transfer",
      balance,
      typeOperation,
      local,
    };

    let errors = await validate(origin);

    if (errors.length > 0) throw new OperationError(errors);

    let transfer: GenericBankVerify = { ...origin } as GenericBankVerify;

    errors = await validate(transfer);

    if (errors.length > 0) throw new OperationError(errors);

    origin.balance = destinationId ? `-${balance}` : balance;

    const destination: CreateOperationGenericBankInput | undefined =
      destinationId
        ? {
            genericBankId: destinationId,
            tag: "transfer",
            description: "transfer",
            balance,
            typeOperation,
            local,
          }
        : undefined;

    if (destination) {
      errors = await validate(destination);

      if (errors.length > 0) throw new OperationError(errors);

      transfer = { ...destination } as GenericBankVerify;

      errors = await validate(transfer);

      if (errors.length > 0) throw new OperationError(errors);
    }

    return await loggedContext(context, async (em) => {
      const originBank = await em.findOne(GenericBank, {
        where: { id: origin.genericBankId, userId },
      });

      if (!originBank) throw new Error(GENERIC_BANK_BOX_REQUIRED);

      const destinyBank = destination
        ? await em.findOne(GenericBank, {
            where: { id: destination.genericBankId, userId },
          })
        : undefined;

      if (destination && !destinyBank)
        throw new Error(GENERIC_BANK_BOX_REQUIRED);

      if (destinyBank && destination)
        destinyBank.balance = decimalSum(
          destinyBank.balance,
          destination.balance
        );

      if (decimalGreaterThan("0.00", origin.balance))
        if (decimalGreaterThan(balance, originBank.balance))
          throw new Error(INSUFFICIENT_BALANCE);

      originBank.balance = decimalSum(originBank.balance, origin.balance);

      try {
        await em.save(GenericBank, originBank);

        if (destinyBank) await em.save(GenericBank, destinyBank);

        const items = [];
        let total = 0;

        const tag = `${destinationId ? "Transfer sent" : "Transfer received"}. (${origin.typeOperation}).`;

        const originItem = await em.save(OperationGenericBank, {
          ...origin,
          tag,
          description: tag + ` Value: ${origin.balance}.`,
          amount: origin.balance,
          operationRegister: randomUUID(7),
          typeOperation,
        });

        const destinyItem = destination
          ? await em.save(OperationGenericBank, {
              ...destination,
              tag: `Trasnfer received. (${origin.typeOperation}).`,
              description: tag + ` Value: ${origin.balance}.`,
              amount: destination.balance,
              operationRegister: randomUUID(7),
              typeOperation,
            })
          : undefined;

        if (originItem) {
          items.push(toOperationGenericBankDto(originItem));
          total += 1;
        }

        if (destinyItem) {
          items.push(toOperationGenericBankDto(destinyItem));
          total += 1;
        }

        return { items, total };
      } catch (error) {
        console.error("Failed to save generic bank operation transfer:", error);

        throw new Error("Failed to save generic bank operation trasfer.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationGenericBankDto)
  async operationGenericBankBoxUpdate(
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
    @Arg("input", () => CreateOperationGenericBankInput)
    input: CreateOperationGenericBankInput
  ): Promise<OperationGenericBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    if (input.genericBankBoxId)
      throw new Error(
        "GenericBankBoxId should not be provided for this operation."
      );

    input.balance = clearDecimal(input.balance);

    const genericVerify: GenericBankVerify = {
      ...input,
    };

    let errors = await validate(genericVerify);

    if (errors.length > 0) throw new OperationError(errors);

    const omitted: DiscountForfeitOmitted = { ...input };

    errors = await validate(omitted);

    if (errors.length > 0) throw new OperationError(errors);

    if (input.local !== LocalEnum.EXTERNAL)
      throw new Error("Local must be exactly EXTERNAL for this operation.");

    const deposit: DepositVerify = { ...input };

    errors = await validate(deposit);

    if (errors.length > 0) throw new OperationError(errors);

    return await loggedContext(context, async (em) => {
      const genericBank = await em.findOne(GenericBank, {
        where: { id: input.genericBankId, userId },
      });

      if (!genericBank) throw new Error(GENERIC_BANK_NOT_FOUND);

      genericBank.balance = decimalSum(genericBank.balance, input.balance);

      try {
        const operationRegister = randomUUID(7);

        await em.save(GenericBank, genericBank);

        const operation = em.create(OperationGenericBank, {
          ...input,
          operationRegister,
          amount: input.balance,
        });

        const newOperation = await em.save(OperationGenericBank, operation);

        return toOperationGenericBankDto(newOperation);
      } catch (error) {
        console.error(
          "Failed to perform operation generic bank deposit:",
          error
        );

        throw new Error("Failed to perform operation generic bank deposit.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationGenericBankDto)
  async operationGenericBankWithdraw(
    @Ctx() context: MyContext,
    @Arg("input", () => CreateOperationGenericBankInput)
    input: CreateOperationGenericBankInput
  ): Promise<OperationGenericBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    if (input.genericBankBoxId)
      throw new Error(
        "GenericBankBoxId should not be provided for this operation."
      );

    input.balance = clearDecimal(input.balance);

    const genericVerify: GenericBankVerify = {
      ...input,
    };

    let errors = await validate(genericVerify);

    if (errors.length > 0) throw new OperationError(errors);

    const omitted: DiscountForfeitOmitted = { ...input };

    errors = await validate(omitted);

    if (errors.length > 0) throw new OperationError(errors);

    if (input.local !== LocalEnum.EXTERNAL)
      throw new Error("Local must be exactly EXTERNAL for this operation.");

    const withdraw: WithdrawVerify = { ...input };

    errors = await validate(withdraw);

    if (errors.length > 0) throw new OperationError(errors);

    return await loggedContext(context, async (em) => {
      const genericBank = await em.findOne(GenericBank, {
        where: { id: input.genericBankId, userId },
      });

      if (!genericBank) throw new Error(GENERIC_BANK_NOT_FOUND);

      const balance = input.balance.replace("-", "");

      if (decimalGreaterThan(balance, genericBank.balance))
        throw new Error(INSUFFICIENT_BALANCE);

      genericBank.balance = decimalSum(genericBank.balance, input.balance);

      try {
        const operationRegister = randomUUID(7);

        await em.save(GenericBank, genericBank);

        const operation = em.create(OperationGenericBank, {
          ...input,
          operationRegister,
          amount: input.balance,
        });

        const newOperation = await em.save(OperationGenericBank, operation);

        return toOperationGenericBankDto(newOperation);
      } catch (error) {
        console.error(
          "Failed to perform operation generic bank withdraw:",
          error
        );

        throw new Error("Failed to perform operation generic bank withdraw.");
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

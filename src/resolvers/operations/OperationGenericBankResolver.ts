import {
  GENERIC_BANK_NOT_FOUND,
  INSUFFICIENT_BALANCE,
  USER_NOT_AUTHENTICATED,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { GenericBank } from "@/entities/GenericBank";
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
    @Arg("originId", () => String) originId: string,
    @Arg("destinationId", () => String) destinationId?: string
  ): Promise<PaginatedOperationGenericBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    if (!uuidFourVerify(originId))
      throw new Error("Origin Bank ID is not a valid UUID.");

    if (destinationId && !uuidFourVerify(destinationId))
      throw new Error("Destination Bank ID is not a valid UUID.");

    balance = clearDecimal(balance);

    if (destinationId) balance = balance.replace("-", "");

    const operations: Record<string, CreateOperationGenericBankInput | null> = {
      origin: {
        genericBankId: originId,
        balance: destinationId ? decimalMultiply(balance, "-1.00") : balance,
        tag: "TRANSFER",
        description: "Transfer to destination bank",
        typeOperation: OperationEnum.TRANSFER,
        local: destinationId ? LocalEnum.INTERNAL : LocalEnum.EXTERNAL,
      } as CreateOperationGenericBankInput,
      destination: destinationId
        ? ({
            genericBankId: destinationId,
            balance,
            tag: "TRANSFER",
            description: "Transfer from origin bank",
            typeOperation: OperationEnum.TRANSFER,
            local: LocalEnum.INTERNAL,
          } as CreateOperationGenericBankInput)
        : null,
    };

    let errors = await validate(
      operations.origin as CreateOperationGenericBankInput
    );

    if (errors.length > 0) throw new OperationError(errors);

    errors = await validate({
      ...operations.origin,
    } as GenericBankVerify);

    if (errors.length > 0) throw new OperationError(errors);

    if (operations.destination) {
      errors = await validate(
        operations.destination as CreateOperationGenericBankInput
      );

      if (errors.length > 0) throw new OperationError(errors);

      errors = await validate({
        ...operations.destination,
      } as GenericBankVerify);

      if (errors.length > 0) throw new OperationError(errors);
    }

    return await loggedContext(context, async (em) => {
      const originBank = await em.findOne(GenericBank, {
        where: { id: operations.origin?.genericBankId, userId },
      });

      if (!originBank) throw new Error(GENERIC_BANK_NOT_FOUND);

      const destinationBank = await em.findOne(GenericBank, {
        where: { id: operations.destination?.genericBankId, userId },
      });

      if (operations.destination && !destinationBank)
        throw new Error(GENERIC_BANK_NOT_FOUND);

      if (decimalGreaterThan(balance.replace("-", ""), originBank.balance))
        throw new Error(INSUFFICIENT_BALANCE);

      try {
        originBank.balance = decimalSum(
          originBank.balance,
          operations.origin?.balance ?? "0.00"
        );

        await em.save(GenericBank, originBank);

        if (operations.destination && destinationBank) {
          destinationBank.balance = decimalSum(
            destinationBank.balance,
            operations.destination.balance
          );

          await em.save(GenericBank, destinationBank);
        }

        const origin = operations.origin
          ? await em.save(OperationGenericBank, {
              ...operations.origin,
              tag: `Sent trasference of ${operations.destination?.balance}.`,
              description: `Sent {${operations.destination?.balance}} to bank ${destinationBank?.name}.`,
              operationRegister: randomUUID(7),
              amount: operations.origin?.balance,
            })
          : null;

        const destination = operations.destination
          ? await em.save(OperationGenericBank, {
              ...operations.destination,
              tag: `Received trasference of ${operations.destination?.balance}.`,
              description: `Received {${operations.destination?.balance}} to bank ${destinationBank?.name}.`,
              operationRegister: randomUUID(7),
              amount: operations.destination?.balance,
            })
          : null;

        const items = [];
        let total = 0;

        if (origin) {
          items.push(toOperationGenericBankDto(origin));
          total += 1;
        }

        if (destination) {
          items.push(toOperationGenericBankDto(destination));
          total += 1;
        }

        return { items, total };
      } catch (error) {
        console.error(
          "Failed to perform operation generic bank transfer:",
          error
        );

        throw new Error("Failed to perform operation generic bank transfer.");
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
}

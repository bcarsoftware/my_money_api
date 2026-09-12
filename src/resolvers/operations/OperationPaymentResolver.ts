import { USER_NOT_AUTHENTICATED } from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { OperationPayment } from "@/entities/OperationPayment";
import { PaginatedOperationPaymentDto } from "@/resolvers/operations/dtos/OperationPaymentDto";
import { ListOperationPaymentInput } from "@/resolvers/operations/inputs/OperationPaymentInputs";
import { generalQueryFilter } from "@/resolvers/operations/utils/generalQueryFilter";
import { loggedContext } from "@/utils/loggedContext";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Query, Resolver } from "type-graphql";
import { toOperationPaymentDto } from "./dtos/toOperationPaymentDto";

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
}

import { USER_NOT_AUTHENTICATED } from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { OperationMoney } from "@/entities/OperationMoney";
import { PaginatedOperationMoneyDto } from "@/resolvers/operations/dtos/OperationMoneyDto";
import { toOperationMoneyDto } from "@/resolvers/operations/dtos/toOperationMoneyDto";
import { ListOperationMoneyInput } from "@/resolvers/operations/inputs/OperationMoneyInputs";
import { generalQueryFilter } from "@/resolvers/operations/utils/generalQueryFilter";
import { loggedContext } from "@/utils/loggedContext";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Query, Resolver } from "type-graphql";

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

        throw new Error("Failed to fetch operation generic bank list.");
      }
    });
  }
}

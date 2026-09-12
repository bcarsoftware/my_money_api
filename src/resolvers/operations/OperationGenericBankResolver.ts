import { USER_NOT_AUTHENTICATED } from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { OperationGenericBank } from "@/entities/OperationGenericBank";
import { PaginatedOperationGenericBankDto } from "@/resolvers/operations/dtos/OperationGenericBankDto";
import { toOperationGenericBankDto } from "@/resolvers/operations/dtos/toOperationGenericBankDto";
import { ListOperationGenericBankInput } from "@/resolvers/operations/inputs/OperationGenericBankInputs";
import { generalQueryFilter } from "@/resolvers/operations/utils/generalQueryFilter";
import { loggedContext } from "@/utils/loggedContext";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Query, Resolver } from "type-graphql";

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
}

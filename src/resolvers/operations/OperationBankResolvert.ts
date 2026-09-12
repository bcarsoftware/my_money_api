import { USER_NOT_AUTHENTICATED } from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { OperationBank } from "@/entities/OperationBank";
import { PaginatedOperationBankDto } from "@/resolvers/operations/dtos/OperationBankDto";
import { toOperationBankDto } from "@/resolvers/operations/dtos/toOperationBankDto";
import { ListOperationBankInput } from "@/resolvers/operations/inputs/OperationBankInputs";
import { generalQueryFilter } from "@/resolvers/operations/utils/generalQueryFilter";
import { loggedContext } from "@/utils/loggedContext";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Query, Resolver } from "type-graphql";

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
}

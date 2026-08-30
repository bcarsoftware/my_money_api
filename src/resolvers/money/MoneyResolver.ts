import { type MyContext } from "@/context/MyContext";
import { Money } from "@/entities/Money";
import { PaginatedMoney } from "@/resolvers/money/dto/MoneyDto";
import { ListMoneyInput } from "@/resolvers/money/MoneyInput";
import { loggedContext } from "@/utils/loggedContext";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Query, Resolver } from "type-graphql";

@Resolver()
export class MoneyResolver {
  @Protected()
  @Query(() => PaginatedMoney)
  async listMoney(
    @Ctx() context: MyContext,
    @Arg("input", () => ListMoneyInput) input: ListMoneyInput
  ): Promise<PaginatedMoney> {
    const limit = input.limit;
    const offset = input.offset;

    return loggedContext(context, async (em) => {
      try {
        const where = {
          userId: context.userId,
          limit,
          offset,
          ...(input.tag ? { tag: input.tag } : {}),
        };

        const [money, total] = await em.findAndCount(Money, { where });

        return { money, total };
      } catch (error) {
        console.log("Error occurred in listMoney:", error);
        throw error;
      }
    });
  }
}

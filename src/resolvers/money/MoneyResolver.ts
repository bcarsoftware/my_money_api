import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

import {
  CreateMoneyInput,
  ListMoneyInput,
  UpdateMoneyInput,
} from "@/resolvers/money/MoneyInputs";

import { type MyContext } from "@/context/MyContext";
import { Money } from "@/entities/Money";
import { MessageResponse } from "@/resolvers/MessageResponse";
import { MoneyDto, PaginatedMoney } from "@/resolvers/money/dto/MoneyDto";
import { loggedContext } from "@/utils/loggedContext";
import { updatableFieldResolve } from "@/utils/updatableFieldResolve";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { ILike } from "typeorm";
import { toMoneyDto } from "./dto/toMoneyDto";

@Resolver()
export class MoneyResolver {
  @Protected()
  @Query(() => PaginatedMoney)
  async listMoney(
    @Ctx() context: MyContext,
    @Arg("input", () => ListMoneyInput) input: ListMoneyInput
  ): Promise<PaginatedMoney> {
    const { limit, offset, tag } = input;

    return await loggedContext(context, async (em) => {
      try {
        const where = {
          userId: context.userId,
          ...(tag ? { tag: ILike(`%${tag}%`) } : {}),
        };

        const [moneys, total] = await em.findAndCount(Money, {
          where,
          take: limit,
          skip: offset,
        });

        const items = moneys.map((money) => toMoneyDto(money));

        return { items, total };
      } catch (error) {
        console.log("Error occurred in listMoney:", error);
        throw error;
      }
    });
  }

  @Protected()
  @Mutation(() => MoneyDto)
  async createMoney(
    @Ctx() context: MyContext,
    @Arg("input", () => CreateMoneyInput) input: CreateMoneyInput
  ): Promise<MoneyDto> {
    return await loggedContext(context, async (em) => {
      try {
        const money = em.create(Money, {
          ...input,
          userId: context.userId,
        });
        const newMoney = await em.save(money);
        return toMoneyDto(newMoney);
      } catch (error) {
        console.log("Error occurred in createMoney:", error);
        throw error;
      }
    });
  }

  @Protected()
  @Mutation(() => MoneyDto)
  async updateMoney(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string,
    @Arg("input", () => UpdateMoneyInput) input: UpdateMoneyInput
  ): Promise<MoneyDto> {
    return await loggedContext(context, async (em) => {
      try {
        const where = { userId: context.userId, id };
        const money = await em.findOneOrFail(Money, { where });

        money.tag =
          input.tag && money.tag !== input.tag ? input.tag : money.tag;
        money.objective = updatableFieldResolve<string>(
          input.objective,
          money.objective
        );
        money.description = updatableFieldResolve<string>(
          input.description,
          money.description
        );
        money.balance =
          input.balance && money.balance ? input.balance : money.balance;

        const uptMoney = await em.save(money);
        return toMoneyDto(uptMoney);
      } catch (error) {
        console.log("Error occurred in updateMoney:", error);
        throw error;
      }
    });
  }

  @Protected()
  @Mutation(() => MessageResponse)
  async deleteMoney(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string
  ): Promise<MessageResponse> {
    return await loggedContext(context, async (em) => {
      try {
        const where = { userId: context.userId, id };

        const money = await em.findOneOrFail(Money, { where });

        await em.softRemove(money);

        return { message: "Money deleted successfully." };
      } catch (error) {
        console.log("Error occurred in deleteMoney:", error);
        throw error;
      }
    });
  }
}

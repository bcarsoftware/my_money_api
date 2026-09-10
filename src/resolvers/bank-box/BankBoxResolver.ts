import {
  BANK_BOX_NOT_FOUND,
  USER_BANK_NOT_MATCH,
  USER_NOT_AUTHORIZED,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { Bank } from "@/entities/Bank";
import { BankBox } from "@/entities/BankBox";
import {
  CreateBankBoxInput,
  ListBankBoxInput,
  UpdateBankBoxInput,
} from "@/resolvers/bank-box/BankBoxInputs";
import {
  BankBoxDto,
  PaginatedBankBoxDto,
} from "@/resolvers/bank-box/dto/BankBoxDto";
import { clearDecimal } from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { updatableFieldResolver } from "@/utils/updatableFieldResolverr";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { ILike } from "typeorm";
import { MessageResponse } from "../MessageResponse";
import { toBankBoxDto } from "./dto/toBankBoxDto";

@Resolver()
export class BankBoxResolver {
  @Protected()
  @Query(() => PaginatedBankBoxDto)
  async listBankBox(
    @Ctx() context: MyContext,
    @Arg("input", () => ListBankBoxInput) input: ListBankBoxInput
  ): Promise<PaginatedBankBoxDto> {
    const { limit, offset } = input;
    const { userId } = context;

    return await loggedContext(context, async (em) => {
      const bank = await em.findOne(Bank, {
        where: { id: input.bankId, userId },
      });

      if (!bank) throw new Error(USER_BANK_NOT_MATCH);

      try {
        const where = {
          bankId: input.bankId,
          ...(input.tag ? { tag: ILike(`%${input.tag}%`) } : {}),
        };

        const [bankBoxes, total] = await em.findAndCount(BankBox, {
          where,
          take: limit,
          skip: offset,
        });

        const items = bankBoxes.map((bankBox) => toBankBoxDto(bankBox));

        return {
          items,
          total,
        };
      } catch (error) {
        console.error("Error listing bank boxes:", error);
        throw new Error("Failed to list bank boxes.");
      }
    });
  }

  @Protected()
  @Mutation(() => BankBoxDto)
  async createBankBox(
    @Ctx() context: MyContext,
    @Arg("input", () => CreateBankBoxInput) input: CreateBankBoxInput
  ): Promise<BankBoxDto> {
    const { userId } = context;

    return await loggedContext(context, async (em) => {
      try {
        await em.findOneOrFail(Bank, { where: { id: input.bankId, userId } });

        const bankBox = em.create(BankBox, {
          ...input,
          userId: context.userId,
          balance: clearDecimal(input.balance),
        });

        const newBankBox = await em.save(bankBox);

        return toBankBoxDto(newBankBox);
      } catch (error) {
        console.error("Error creating bank box:", error);
        throw new Error("Failed to create bank box.");
      }
    });
  }

  @Protected()
  @Mutation(() => BankBoxDto)
  async updateBankBox(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string,
    @Arg("input", () => UpdateBankBoxInput) input: UpdateBankBoxInput
  ): Promise<BankBoxDto> {
    return await loggedContext(context, async (em) => {
      const where = { id };
      const bankBox = await em.findOne(BankBox, {
        where,
        relations: { bank: true },
      });

      if (!bankBox) throw new Error(BANK_BOX_NOT_FOUND);

      if (bankBox.bank.userId !== context.userId)
        throw new Error(USER_NOT_AUTHORIZED);

      try {
        bankBox.tag = input.tag ?? bankBox.tag;
        bankBox.description = updatableFieldResolver<string>(
          input.description,
          bankBox.description
        );
        bankBox.objective = updatableFieldResolver<string>(
          input.objective,
          bankBox.objective
        );

        const uptBankBox = await em.save(bankBox);
        return toBankBoxDto(uptBankBox);
      } catch (error) {
        console.error("Error updating bank box:", error);
        throw new Error("Failed to update bank box.");
      }
    });
  }

  @Protected()
  @Mutation(() => MessageResponse)
  async deleteBankBox(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string
  ): Promise<MessageResponse> {
    return await loggedContext(context, async (em) => {
      try {
        const where = { id, userId: context.userId };
        const bankBox = await em.findOneOrFail(BankBox, {
          where,
          relations: { bank: true },
        });

        if (bankBox.bank.userId !== context.userId)
          throw new Error(USER_NOT_AUTHORIZED);

        await em.softRemove(bankBox);
        return { message: "Bank box deleted successfully." };
      } catch (error) {
        console.error("Error deleting bank box:", error);
        throw new Error("Failed to delete bank box.");
      }
    });
  }
}

import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { ILike } from "typeorm";

import { type MyContext } from "@/context/MyContext";
import { Bank } from "@/entities/Bank";
import { CreateBankInput, UpdateBankInput } from "@/resolvers/bank/BankInputs";
import { BankDto, PaginatedBankDto } from "@/resolvers/bank/dto/BankDto";
import { toBankDto } from "@/resolvers/bank/dto/toBankDto";
import { MessageResponse } from "@/resolvers/MessageResponse";
import { clearDecimal } from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { ListBankInput } from "./BankInputs";

@Resolver()
export class BankResolver {
  @Protected()
  @Query(() => PaginatedBankDto)
  async listBanks(
    @Ctx() context: MyContext,
    @Arg("input", () => ListBankInput) input: ListBankInput
  ): Promise<PaginatedBankDto> {
    const { limit, offset } = input;
    const userId = context.userId;

    return await loggedContext(context, async (em) => {
      try {
        const where = {
          userId,
          ...(input.code && { code: input.code }),
          ...(input.name && { name: ILike(`%${input.name}%`) }),
          ...(input.accountType && { accountType: input.accountType }),
        };

        const [banks, total] = await em.findAndCount(Bank, {
          where,
          take: limit,
          skip: offset,
        });

        const items = banks.map((bank) => toBankDto(bank));

        return { items, total };
      } catch (error) {
        console.error("Error listing banks:", error);
        throw new Error("Failed to list banks");
      }
    });
  }

  @Protected()
  @Mutation(() => BankDto)
  async createBank(
    @Ctx() context: MyContext,
    @Arg("input", () => CreateBankInput) input: CreateBankInput
  ): Promise<BankDto> {
    const userId = context.userId;

    return await loggedContext(context, async (em) => {
      try {
        const creditLimit = clearDecimal(input.creditLimit);

        const bank = em.create(Bank, {
          ...input,
          balance: clearDecimal(input.balance),
          creditLimit,
          actualLimit: creditLimit,
          userId,
        });
        const newBank = await em.save(bank);
        return toBankDto(newBank);
      } catch (error) {
        console.error("Error creating bank:", error);
        throw new Error("Failed to create bank");
      }
    });
  }

  @Protected()
  @Mutation(() => BankDto)
  async updateBank(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string,
    @Arg("input", () => UpdateBankInput) input: UpdateBankInput
  ): Promise<BankDto> {
    const userId = context.userId;

    return await loggedContext(context, async (em) => {
      try {
        const bank = await em.findOneOrFail(Bank, { where: { id, userId } });

        bank.code = input.code ?? bank.code;
        bank.name = input.name ?? bank.name;
        bank.accountType = input.accountType ?? bank.accountType;
        bank.accountNumber = input.accountNumber ?? bank.accountNumber;
        bank.agency = input.agency ?? bank.agency;
        bank.creditLimit = input.creditLimit
          ? clearDecimal(input.creditLimit)
          : bank.creditLimit;

        const uptBank = await em.save(bank);
        return toBankDto(uptBank);
      } catch (error) {
        console.error("Error updating bank:", error);
        throw new Error("Failed to update bank");
      }
    });
  }

  @Protected()
  @Mutation(() => MessageResponse)
  async deleteBank(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string
  ): Promise<MessageResponse> {
    const userId = context.userId;

    return await loggedContext(context, async (em) => {
      try {
        const bank = await em.findOneOrFail(Bank, { where: { id, userId } });

        await em.softRemove(bank);

        return { message: "Bank deleted successfully." };
      } catch (error) {
        console.error("Error deleting bank:", error);
        throw new Error("Failed to delete bank");
      }
    });
  }
}

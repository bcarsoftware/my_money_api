import { type MyContext } from "@/context/MyContext";
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
import { updatableFieldResolve } from "@/utils/updatableFieldResolve";
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

    return await loggedContext(context, async (em) => {
      try {
        const where = {
          userId: context.userId,
          ...(input.tag ? { tag: ILike(`%${input.tag}%`) } : {}),
          ...(input.bankId ? { bankId: input.bankId } : {}),
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
    return await loggedContext(context, async (em) => {
      try {
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
      try {
        const where = { id, userId: context.userId };
        const bankBox = await em.findOneOrFail(BankBox, { where });

        bankBox.tag = input.tag ?? bankBox.tag;
        bankBox.bankId = input.bankId ?? bankBox.bankId;
        bankBox.description = updatableFieldResolve<string>(
          input.description,
          bankBox.description
        );
        bankBox.objective = updatableFieldResolve<string>(
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
        const bankBox = await em.findOneOrFail(BankBox, { where });

        await em.softRemove(bankBox);
        return { message: "Bank box deleted successfully." };
      } catch (error) {
        console.error("Error deleting bank box:", error);
        throw new Error("Failed to delete bank box.");
      }
    });
  }
}

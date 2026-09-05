import { type MyContext } from "@/context/MyContext";
import { GenericBank } from "@/entities/GenericBank";
import { GenericBankInfo } from "@/entities/GenericBankInfo";
import {
  GenericBankDto,
  PaginatedGenericBankDto,
} from "@/resolvers/genereic-bank/dto/GenericBankDto";
import {
  CreateGenericBankInput,
  ListGenericBankInput,
  UpdateGenericBankInput,
} from "@/resolvers/genereic-bank/GenericBankInputs";
import { clearDecimal } from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { ILike } from "typeorm";
import { MessageResponse } from "@/resolvers/MessageResponse";
import { toGenericBankDto } from "@/resolvers/genereic-bank/dto/toGenericBankDto";

@Resolver()
export class GenericBankResolver {
  @Protected()
  @Query(() => PaginatedGenericBankDto)
  async listGenericBanks(
    @Ctx() context: MyContext,
    @Arg("input", () => ListGenericBankInput) input: ListGenericBankInput
  ): Promise<PaginatedGenericBankDto> {
    const { limit, offset } = input;
    const userId = context.userId;

    return loggedContext(context, async (em) => {
      try {
        const where = {
          userId,
          ...(input.bankId && { bankId: input.bankId }),
          ...(input.name && { name: ILike(`%${input.name}%`) }),
          ...(input.currency && { currency: input.currency }),
        };
        const [genericBanks, total] = await em.findAndCount(GenericBank, {
          where,
          take: limit ?? 20,
          skip: offset ?? 0,
          relations: { bankInfo: true, bank: true },
        });

        const items = genericBanks.map((genericBank) =>
          toGenericBankDto(genericBank)
        );

        return { items, total };
      } catch (error) {
        console.error("Error in listGenericBanks:", error);
        throw new Error("Failed to list generic banks");
      }
    });
  }

  @Protected()
  @Mutation(() => GenericBankDto)
  async createGenericBank(
    @Ctx() context: MyContext,
    @Arg("input", () => CreateGenericBankInput) input: CreateGenericBankInput
  ): Promise<GenericBankDto> {
    const userId = context.userId;

    return loggedContext(context, async (em) => {
      try {
        const genericBank = await em
          .create(GenericBank, {
            userId,
            bankId: input.bankId,
            name: input.name,
            currency: input.currency,
            balance: clearDecimal(input.balance),
          })
          .save();

        for (const bankInfo of genericBank.bankInfo ?? []) {
          await em
            .create(GenericBankInfo, {
              genericBankId: genericBank.id,
              name: bankInfo.name,
              value: bankInfo.value,
            })
            .save();
        }

        await genericBank.reload();

        return toGenericBankDto(genericBank);
      } catch (error) {
        console.error("Error in createGenericBank:", error);
        throw new Error("Failed to create generic bank");
      }
    });
  }

  @Protected()
  @Mutation(() => GenericBankDto)
  async updateGenericBank(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string,
    @Arg("input", () => UpdateGenericBankInput) input: UpdateGenericBankInput
  ): Promise<GenericBankDto> {
    const userId = context.userId;

    return loggedContext(context, async (em) => {
      try {
        const genericBank = await em.findOneOrFail(GenericBank, {
          where: { id, userId },
          relations: { bankInfo: true },
        });

        genericBank.name = input.name ?? genericBank.name;

        for (const info of input.bankInfo ?? []) {
          const existingInfo = genericBank.bankInfo.find(
            (bi) => bi.id === info.id
          );
          if (existingInfo) {
            existingInfo.name = info.name;
            existingInfo.value = info.value;
            await em.save(existingInfo);
          }
        }

        await genericBank.reload();

        return toGenericBankDto(genericBank);
      } catch (error) {
        console.error("Error in updateGenericBank:", error);
        throw new Error("Failed to update generic bank.");
      }
    });
  }

  @Protected()
  @Mutation(() => MessageResponse)
  async deleteGenericBank(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string
  ): Promise<MessageResponse> {
    const userId = context.userId;

    return loggedContext(context, async (em) => {
      try {
        const genericBank = await em.findOneOrFail(GenericBank, {
          where: { id, userId },
        });

        await em.softRemove(genericBank);

        return { message: "Generic bank deleted successfully." };
      } catch (error) {
        console.error("Error in deleteGenericBank:", error);
        throw new Error("Failed to delete generic bank.");
      }
    });
  }
}

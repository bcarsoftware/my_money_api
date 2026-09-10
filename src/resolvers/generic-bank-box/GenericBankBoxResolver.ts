import {
  GENERIC_BANK_BOX_NOT_FOUND,
  GENERIC_BANK_NOT_FOUND,
  USER_NOT_AUTHENTICATED,
  USER_NOT_AUTHORIZED,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { GenericBank } from "@/entities/GenericBank";
import { GenericBankBox } from "@/entities/GenericBankBox";
import {
  GenericBankBoxDto,
  PaginatedGenericBankBoxDto,
} from "@/resolvers/generic-bank-box/dto/GenericBankBoxDto";
import { toGenericBankBoxDto } from "@/resolvers/generic-bank-box/dto/toGenericBankBoxDto";
import {
  CreateGenericBankBoxInput,
  ListGenericBankBoxInput,
  UpdateGenericBankBoxInput,
} from "@/resolvers/generic-bank-box/GenericBankBoxInputs";
import { MessageResponse } from "@/resolvers/MessageResponse";
import { loggedContext } from "@/utils/loggedContext";
import { updatableFieldResolver } from "@/utils/updatableFieldResolver";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { EntityManager, ILike } from "typeorm";

@Resolver()
export class GenericBankBoxResolver {
  @Protected()
  @Query(() => PaginatedGenericBankBoxDto)
  async listGenericBankBoxes(
    @Ctx() context: MyContext,
    @Arg("input", () => ListGenericBankBoxInput) input: ListGenericBankBoxInput
  ): Promise<PaginatedGenericBankBoxDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    return await loggedContext(context, async (em) => {
      await this.verifyGenericBankOwnership(em, input.genericBankId, userId);

      try {
        const where = {
          genericBankId: input.genericBankId,
          ...(input.name ? { name: ILike(`%${input.name}%`) } : {}),
        };

        const [genericBankBoxes, total] = await em.findAndCount(
          GenericBankBox,
          { where, take: input.limit ?? 20, skip: input.offset ?? 0 }
        );

        const items = genericBankBoxes.map(toGenericBankBoxDto);

        return { items, total };
      } catch (error) {
        console.error("Error listing generic bank boxes:", error);
        throw new Error("Failed to list generic bank boxes.");
      }
    });
  }

  @Protected()
  @Mutation(() => GenericBankBoxDto)
  async createGenericBankBox(
    @Ctx() context: MyContext,
    @Arg("input", () => CreateGenericBankBoxInput)
    input: CreateGenericBankBoxInput
  ): Promise<GenericBankBoxDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    return await loggedContext(context, async (em) => {
      await this.verifyGenericBankOwnership(em, input.genericBankId, userId);

      try {
        const genericBankBox = em.create(GenericBankBox, { ...input });

        const newGenericBankBox = await em.save(genericBankBox);

        return toGenericBankBoxDto(newGenericBankBox);
      } catch (error) {
        console.error("Error creating generic bank box:", error);
        throw new Error("Failed to create generic bank box.");
      }
    });
  }

  @Protected()
  @Mutation(() => GenericBankBoxDto)
  async updateGenericBankBox(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string,
    @Arg("input", () => UpdateGenericBankBoxInput)
    input: UpdateGenericBankBoxInput
  ): Promise<GenericBankBoxDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    return await loggedContext(context, async (em) => {
      const genericBankBox = await em.findOne(GenericBankBox, {
        where: { id },
        relations: { genericBank: true },
      });

      if (!genericBankBox) throw new Error(GENERIC_BANK_BOX_NOT_FOUND);

      await this.verifyGenericBankOwnership(
        em,
        genericBankBox.genericBank.id,
        userId
      );

      try {
        genericBankBox.name = input.name ?? genericBankBox.name;
        genericBankBox.objective = updatableFieldResolver<string>(
          input.objective,
          genericBankBox.objective
        );
        genericBankBox.description = updatableFieldResolver<string>(
          input.description,
          genericBankBox.description
        );

        const updatedGenericBankBox = await em.save(genericBankBox);

        return toGenericBankBoxDto(updatedGenericBankBox);
      } catch (error) {
        console.error("Error updating generic bank box:", error);
        throw new Error("Failed to update generic bank box.");
      }
    });
  }

  @Protected()
  @Mutation(() => MessageResponse)
  async deleteGenericBankBox(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string
  ): Promise<MessageResponse> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    return await loggedContext(context, async (em) => {
      const genericBankBox = await em.findOne(GenericBankBox, {
        where: { id },
        relations: { genericBank: true },
      });

      if (!genericBankBox) throw new Error(GENERIC_BANK_BOX_NOT_FOUND);

      if (genericBankBox.balance !== "0.00") {
        throw new Error(
          "Cannot delete a generic bank box with a non-zero balance."
        );
      }

      try {
        await this.verifyGenericBankOwnership(
          em,
          genericBankBox.genericBank.id,
          userId
        );

        await em.softRemove(genericBankBox);

        return { message: "Generic bank box deleted successfully." };
      } catch (error) {
        console.error("Error deleting generic bank box:", error);
        throw new Error("Failed to delete generic bank box.");
      }
    });
  }

  private async verifyGenericBankOwnership(
    em: EntityManager,
    genericBankId: string,
    userId: string
  ): Promise<void> {
    const genericBank = await em.findOne(GenericBank, {
      where: { id: genericBankId },
      relations: { user: true },
    });

    if (!genericBank) throw new Error(GENERIC_BANK_NOT_FOUND);

    if (genericBank.userId !== userId) throw new Error(USER_NOT_AUTHORIZED);
  }
}

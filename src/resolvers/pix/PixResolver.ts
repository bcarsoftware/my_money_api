import { type MyContext } from "@/context/MyContext";
import { Pix } from "@/entities/Pix";
import { PaginatedPixDto, PixDto } from "@/resolvers/pix/dto/PixDto";
import {
  CreatePixInput,
  ListPixInput,
  UpdatePixInput,
} from "@/resolvers/pix/PixInputs";
import { loggedContext } from "@/utils/loggedContext";
import { updatableFieldResolve } from "@/utils/updatableFieldResolve";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { ILike } from "typeorm";
import { MessageResponse } from "../MessageResponse";
import { pixChecker } from "./pixUtils";
import { toPixDto } from "./dto/toPixDto";

@Resolver()
export class PixResolver {
  @Protected()
  @Query(() => PaginatedPixDto)
  async listPix(
    @Ctx() context: MyContext,
    @Arg("input", () => ListPixInput) input: ListPixInput
  ): Promise<PaginatedPixDto> {
    const { limit, offset, tag } = input;

    return await loggedContext(context, async (em) => {
      try {
        const where = {
          userId: context.userId,
          ...(input.bankId ? { bankId: input.bankId } : {}),
          ...(tag ? { tag: ILike(`%${tag}%`) } : {}),
        };

        const [pixs, total] = await em.findAndCount(Pix, {
          where,
          take: limit,
          skip: offset,
        });

        const items = pixs.map((pix) => toPixDto(pix));

        return { items, total };
      } catch (error) {
        console.log("Error occurred in listPix:", error);
        throw error;
      }
    });
  }

  @Protected()
  @Mutation(() => PixDto)
  async createPix(
    @Ctx() context: MyContext,
    @Arg("input", () => CreatePixInput) input: CreatePixInput
  ): Promise<PixDto> {
    return await loggedContext(context, async (em) => {
      try {
        pixChecker(input.typeKey, input.key);

        const pix = em.create(Pix, {
          ...input,
          userId: context.userId,
        });
        const newPix = await em.save(pix);
        return toPixDto(newPix);
      } catch (error) {
        console.log("Error occurred in createPix:", error);
        throw error;
      }
    });
  }

  @Protected()
  @Mutation(() => PixDto)
  async updatePix(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string,
    @Arg("input", () => UpdatePixInput) input: UpdatePixInput
  ): Promise<PixDto> {
    return await loggedContext(context, async (em) => {
      try {
        pixChecker(input.typeKey, input.key);

        const where = { id, userId: context.userId };
        const pix = await em.findOneOrFail(Pix, { where });

        pix.bankId = input.bankId ?? pix.bankId;
        pix.tag = input.tag ?? pix.tag;
        pix.description = updatableFieldResolve<string>(
          input.description,
          pix.description
        );
        pix.typeKey = input.typeKey ?? pix.typeKey;
        pix.key = input.key ?? pix.key;

        const uptPix = await em.save(pix);
        return toPixDto(uptPix);
      } catch (error) {
        console.log("Error occurred in updatePix:", error);
        throw error;
      }
    });
  }

  @Protected()
  @Mutation(() => MessageResponse)
  async deletePix(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string
  ): Promise<MessageResponse> {
    return await loggedContext(context, async (em) => {
      try {
        const where = { id, userId: context.userId };

        const pix = await em.findOne(Pix, { where });
        if (!pix) {
          throw new Error("Pix not found");
        }

        await em.softRemove(pix);
        return { message: "Pix deleted successfully." };
      } catch (error) {
        console.log("Error occurred in deletePix:", error);
        throw error;
      }
    });
  }
}

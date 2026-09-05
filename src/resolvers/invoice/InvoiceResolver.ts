import { INVOICE_NOT_FOUND, USER_BANK_NOT_MATCH } from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { Invoice } from "@/entities/Invoice";
import {
  InvoiceDto,
  PaginatedInvoiceDto,
} from "@/resolvers/invoice/dto/InvoiceDto";
import {
  CreateInvoiceInput,
  ListInvoiceInput,
  UpdateInvoiceInput,
} from "@/resolvers/invoice/InvoiceInputs";
import { loggedContext } from "@/utils/loggedContext";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { toInvoiceDto } from "./dto/toInvoiceDto";

@Resolver()
export class InvoiceResolver {
  @Protected()
  @Query(() => PaginatedInvoiceDto)
  async listInvoices(
    @Ctx() context: MyContext,
    @Arg("input", () => ListInvoiceInput) input: ListInvoiceInput
  ): Promise<PaginatedInvoiceDto> {
    const { limit, offset } = input;
    const userId = context.userId;

    return await loggedContext(context, async (em) => {
      try {
        const where = {
          limit,
          offset,
          userId,
          ...(input.status && { status: input.status }),
          ...(input.repeat && { repeat: input.repeat }),
        };

        const [invoices, total] = await em.findAndCount(Invoice, {
          where,
          take: limit,
          skip: offset,
        });

        const items = invoices.map((invoice) => toInvoiceDto(invoice));

        return { items, total };
      } catch (error) {
        console.error("Error listing invoices:", error);
        throw new Error("Failed to list invoices.");
      }
    });
  }

  @Protected()
  @Mutation(() => InvoiceDto)
  async createInvoice(
    @Ctx() context: MyContext,
    @Arg("input", () => CreateInvoiceInput) input: CreateInvoiceInput
  ): Promise<InvoiceDto> {
    const userId = context.userId;

    return await loggedContext(context, async (em) => {
      try {
        const invoice = em.create(Invoice, {
          ...input,
          userId,
        });

        const newInvoice = await em.save(invoice);
        return toInvoiceDto(newInvoice);
      } catch (error) {
        console.error("Error creating invoice:", error);
        throw new Error("Failed to create invoice.");
      }
    });
  }

  @Protected()
  @Mutation(() => InvoiceDto)
  async updateInvoice(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string,
    @Arg("input", () => UpdateInvoiceInput) input: UpdateInvoiceInput
  ): Promise<InvoiceDto> {
    return await loggedContext(context, async (em) => {
      const invoice = await em.findOne(Invoice, {
        where: { id },
        relations: { bank: true },
      });

      if (!invoice) throw new Error(INVOICE_NOT_FOUND);

      if (invoice.bank.userId !== context.userId)
        throw new Error(USER_BANK_NOT_MATCH);

      try {
        invoice.name = input.name ?? invoice.name;
        invoice.description = input.description ?? invoice.description;

        const updatedInvoice = await em.save(invoice);
        return toInvoiceDto(updatedInvoice);
      } catch (error) {
        console.error("Error updating invoice:", error);
        throw new Error("Failed to update invoice.");
      }
    });
  }
}

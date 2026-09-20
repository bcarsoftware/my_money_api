import {
  CREDIT_LIMIT_EXCEEDED,
  INVOICE_NOT_FOUND,
  USER_BANK_NOT_MATCH,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { Bank } from "@/entities/Bank";
import { Invoice } from "@/entities/Invoice";
import { InvoiceStatusEnum } from "@/enums/InvoiceStatusEnum";
import {
  InvoiceDto,
  PaginatedInvoiceDto,
} from "@/resolvers/invoice/dto/InvoiceDto";
import { toInvoiceDto } from "@/resolvers/invoice/dto/toInvoiceDto";
import {
  CreateInvoiceInput,
  InvoiceRefundInput,
  ListInvoiceInput,
  UpdateInvoiceInput,
} from "@/resolvers/invoice/InvoiceInputs";
import { MessageResponse } from "@/resolvers/MessageResponse";
import {
  clearDecimal,
  decimalGreaterThan,
  decimalMultiply,
  decimalSubtract,
  decimalSum,
} from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

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
      const bank = await em.findOne(Bank, {
        where: { id: input.bankId, userId },
      });

      if (!bank) throw new Error(USER_BANK_NOT_MATCH);

      const installs = `${input.installments}.00`;

      const total = decimalMultiply(clearDecimal(input.balance), installs);

      if (decimalGreaterThan(total, bank.actualLimit))
        throw new Error(CREDIT_LIMIT_EXCEEDED);

      try {
        const invoice = em.create(Invoice, {
          ...input,
          status: InvoiceStatusEnum.ACTIVE,
          paidInstallments: 0,
          userId,
          balance: clearDecimal(input.balance),
          total: clearDecimal(total),
        });

        const newInvoice = await em.save(invoice);

        await em.save(Bank, {
          ...bank,
          actualLimit: decimalSubtract(bank.creditLimit, clearDecimal(total)),
        });

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

  @Protected()
  @Mutation(() => InvoiceDto)
  async invoiceRefund(
    @Ctx() context: MyContext,
    @Arg("input", () => InvoiceRefundInput) input: InvoiceRefundInput
  ): Promise<InvoiceDto> {
    return await loggedContext(context, async (em) => {
      const invoice = await em.findOne(Invoice, {
        where: { id: input.id, bankId: input.bankId },
        relations: { bank: true },
      });

      if (!invoice) throw new Error(INVOICE_NOT_FOUND);

      if (invoice.bank.userId !== context.userId)
        throw new Error(USER_BANK_NOT_MATCH);

      try {
        invoice.paidInstallments = invoice.installments;
        invoice.status = InvoiceStatusEnum.REFUNDED;

        const updatedInvoice = await em.save(invoice);

        await em.save(Bank, {
          ...invoice.bank,
          actualLimit: decimalSum(invoice.bank.actualLimit, invoice.total),
        });

        return toInvoiceDto(updatedInvoice);
      } catch (error) {
        console.error(`Error processing invoice refund:`, error);
        throw new Error(`Failed to process invoice refund.`);
      }
    });
  }

  @Protected()
  @Mutation(() => MessageResponse)
  async deleteInvoice(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string
  ): Promise<MessageResponse> {
    return await loggedContext(context, async (em) => {
      const invoice = await em.findOne(Invoice, {
        where: { id },
        relations: { bank: true },
      });

      if (!invoice) throw new Error(INVOICE_NOT_FOUND);

      if (invoice.bank.userId !== context.userId)
        throw new Error(USER_BANK_NOT_MATCH);

      try {
        await em.softRemove(invoice);
        return { message: "Invoice deleted successfully." };
      } catch (error) {
        console.error("Error deleting invoice:", error);
        throw new Error("Failed to delete invoice.");
      }
    });
  }
}

import { Invoice } from "@/entities/Invoice";
import { InvoiceDto } from "@/resolvers/invoice/dto/InvoiceDto";

export const toInvoiceDto = (invoice: Invoice): InvoiceDto => ({
  id: invoice.id,
  name: invoice.name,
  description: invoice.description,
  repeat: invoice.repeat,
  installments: invoice.installments,
  paidInstallments: invoice.paidInstallments,
  balance: invoice.balance,
  total: invoice.total,
  status: invoice.status,
  createdAt: invoice.createdAt.toISOString(),
});

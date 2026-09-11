import { OperationPayment } from "@/entities/OperationPayment";
import { OperationPaymentDto } from "@/resolvers/operations/dtos/OperationPaymentDto";

export const toOperationPaymentDto = (
  operationPayment: OperationPayment
): OperationPaymentDto => ({
  id: operationPayment.id,
  operationRegister: operationPayment.operationRegister,
  userId: operationPayment.userId,
  bankId: operationPayment.bankId ?? null,
  moneyId: operationPayment.moneyId ?? null,
  invoiceId: operationPayment.invoiceId ?? null,
  tag: operationPayment.tag,
  description: operationPayment.description ?? null,
  balance: operationPayment.balance,
  discount: operationPayment.discount ?? null,
  forfeit: operationPayment.forfeit ?? null,
  amount: operationPayment.amount,
  typeOperation: operationPayment.typeOperation,
  local: operationPayment.local,
  createdAt: operationPayment.createdAt.toISOString(),
});

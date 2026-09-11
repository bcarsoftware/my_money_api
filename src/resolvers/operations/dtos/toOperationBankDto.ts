import { OperationBank } from "@/entities/OperationBank";
import { OperationBankDto } from "@/resolvers/operations/dtos/OperationBankDto";

export const toOperationBankDto = (
  operationBank: OperationBank
): OperationBankDto => ({
  id: operationBank.id,
  operationRegister: operationBank.operationRegister,
  userId: operationBank.userId,
  bankId: operationBank.bankId,
  bankBoxId: operationBank.bankBoxId ?? null,
  invoiceId: operationBank.invoiceId ?? null,
  tag: operationBank.tag,
  description: operationBank.description ?? null,
  balance: operationBank.balance,
  discount: operationBank.discount ?? null,
  forfeit: operationBank.forfeit ?? null,
  amount: operationBank.amount,
  typeOperation: operationBank.typeOperation,
  local: operationBank.local,
  createdAt: operationBank.createdAt.toISOString(),
});
